document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');
    const modal = document.getElementById('reservationModal');
    const closeModalBtn = document.querySelector('.close-button');
    const modalForm = document.getElementById('modal-form');
    const modalDatetime = document.getElementById('modal-datetime');
    let selectedInfo = null;

    // 既存の予約データ（現在は空）
    const existingEvents = [];

    const calendar = new FullCalendar.Calendar(calendarEl, {
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'ja',
        initialView: 'timeGridWeek',
        slotMinTime: '07:00:00',
        slotMaxTime: '21:00:00',
        slotDuration: '00:30:00',
        slotLabelFormat: { hour: 'numeric', minute: '2-digit', hour12: false },
        selectable: true,
        selectMirror: true, // 選択範囲のプレースホルダー表示
        businessHours: {
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // 月-日
            startTime: '07:00',
            endTime: '21:00',
        },
        events: existingEvents,
        selectAllow: (selectInfo) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0); // 今日の午前0時を取得

            // 過去の日付は選択不可 (今日の午前0時より前はNG)
            if (selectInfo.start < today) {
                return false;
            }

            // 既存の予約と重複させない
            return !calendar.getEvents().some(event => {
                // 背景イベントは重複チェックの対象外
                return event.display !== 'background' &&
                    selectInfo.start < event.end &&
                    selectInfo.end > event.start;
            });
        },
        select: (info) => {
            selectedInfo = info;
            openModal(info.start, info.end);
            calendar.unselect();
        }
    });

    calendar.render();

    function formatModalTime(start, end) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
        const startDate = start.toLocaleDateString('ja-JP', options);
        const startTime = start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
        const endTime = end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${startDate} ${startTime} 〜 ${endTime}`;
    }

    function openModal(start, end) {
        modalDatetime.textContent = formatModalTime(start, end);
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
        modalForm.reset();
    }

    closeModalBtn.onclick = closeModal;
    window.onclick = (event) => {
        if (event.target === modal) closeModal();
    };

    modalForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitButton = event.target.querySelector('button');
        submitButton.disabled = true;
        submitButton.textContent = '送信中...';

        try {
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;

            const startDate = selectedInfo.start;
            const endDate = selectedInfo.end;

            // Google Apps Scriptに送信するデータ
            const reservationData = {
                date: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
                startTime: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
                endTime: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
                name,
                email,
                phone
            };

            const gasUrl = 'https://script.google.com/macros/s/AKfycbw8NFcaLOtYElMgabkFPUlO8K1uVGMbe9sCqxxOOdzeKXX_UWjObeKzBpXMG56b0cIx/exec';

            // fetchを使用してGASにPOSTリクエストを送信
            await fetch(gasUrl, {
                method: 'POST',
                mode: 'no-cors', // CORSエラーを回避するため、リクエストを送信するのみでレスポンスは取得しない
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(reservationData) // GAS側で e.postData.contents をJSON.parse()で受け取る
            });

            // no-corsモードではレスポンスを確認できないため、エラーなく完了すれば成功とみなす
            console.log('予約データが送信されました:', reservationData);

            // カレンダーにイベントを追加
            const newEvent = {
                title: `予約：${name}`,
                start: selectedInfo.startStr,
                end: selectedInfo.endStr,
            };
            calendar.addEvent(newEvent);

            closeModal();
            alert('ご予約が完了しました！');

        } catch (error) {
            console.error('予約送信エラー:', error);
            alert('予約の送信に失敗しました。ネットワーク接続を確認するか、時間をおいて再度お試しください。');
        } finally {
            // ボタンを元に戻す
            submitButton.disabled = false;
            submitButton.textContent = 'この内容で予約する';
        }
    });

    function getTodayWithTime(hour, minute) {
        const d = new Date();
        d.setHours(hour, minute, 0, 0);
        return d;
    }
});
