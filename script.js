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

        // フォームと確認メッセージの状態をリセット
        const confirmationMessageEl = document.getElementById('confirmation-message');
        modalForm.style.display = 'block';
        confirmationMessageEl.style.display = 'none';
        confirmationMessageEl.innerHTML = '';
        modalForm.reset();

        // 送信ボタンを元の状態に戻す
        const submitButton = modalForm.querySelector('button');
        submitButton.disabled = false;
        submitButton.textContent = 'この内容で予約する';
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

            const reservationData = {
                date: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
                startTime: `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`,
                endTime: `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`,
                name,
                email,
                phone
            };

            const gasUrl = 'https://script.google.com/macros/s/AKfycbw8NFcaLOtYElMgabkFPUlO8K1uVGMbe9sCqxxOOdzeKXX_UWjObeKzBpXMG56b0cIx/exec';

            await fetch(gasUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(reservationData)
            });

            console.log('予約データが送信されました:', reservationData);

            calendar.addEvent({
                title: `予約：${name}`,
                start: selectedInfo.startStr,
                end: selectedInfo.endStr,
            });

            // フォームを非表示にし、確認メッセージを表示
            const confirmationMessageEl = document.getElementById('confirmation-message');
            confirmationMessageEl.innerHTML = `
                <h2>✅ 予約が完了しました！</h2>
                <p>以下の内容で予約を受け付けました：</p>
                <div class="confirm-details">
                    <p><strong>日付：</strong> ${reservationData.date}</p>
                    <p><strong>時間：</strong> ${reservationData.startTime} 〜 ${reservationData.endTime}</p>
                    <p><strong>お名前：</strong> ${reservationData.name}</p>
                </div>
            `;
            modalForm.style.display = 'none';
            confirmationMessageEl.style.display = 'block';

        } catch (error) {
            console.error('予約送信エラー:', error);
            alert('予約の送信に失敗しました。ネットワーク接続を確認するか、時間をおいて再度お試しください。');
            // エラーが発生した場合はボタンを元に戻す
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
