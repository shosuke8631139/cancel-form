document.addEventListener('DOMContentLoaded', () => {
    // Flatpickrの初期化
    flatpickr("#date", {
        locale: "ja",
        dateFormat: "Y-m-d",
    });

    // 開始時間の選択肢を動的に生成 (7:00 ~ 20:30)
    const startTimeSelect = document.getElementById('startTime');
    for (let hour = 7; hour <= 20; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            startTimeSelect.appendChild(option);
        }
    }

    // フォーム送信時の処理
    const cancelForm = document.getElementById('cancel-form');
    cancelForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const submitButton = event.target.querySelector('button');
        submitButton.disabled = true;
        submitButton.textContent = '処理中...';

        const name = document.getElementById('name').value;
        const startTime = document.getElementById('startTime').value;

        // 日付をYYYY-MM-DD形式に整形
        const rawDate = document.getElementById('date').value;
        const dateObj = new Date(rawDate);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        // GASに送信するデータ
        const cancellationData = {
            type: 'cancel',
            name,
            date: formattedDate,
            startTime
        };

        // 【重要】このURLは予約受付用です。必要に応じてキャンセル受付用のGAS URLに変更してください。
        const gasUrl = 'https://script.google.com/macros/s/AKfycbzA85p6WOC0K07-qMcXbmXkriLJQVTUKA3iqkIQ0C4I6qA2N_P--9mAD3m8TN8FFCuF/exec';

        fetch(gasUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cancellationData)
        })
        .then(async response => {
            if (!response.ok) {
                // 返ってきたものがエラーだったときの処理
                const text = await response.text();
                alert('GASからエラー応答がありました。\nステータス: ' + response.status + '\n内容:\n' + text.slice(0, 300));
                return;
            }

            // JSON形式の応答を受け取る
            const result = await response.json();

            if (result.status === 'success') {
                alert('キャンセル成功！\n' + (result.message || ''));
                cancelForm.reset();
            } else {
                alert('キャンセル失敗：' + (result.message || 'エラー内容なし'));
            }
        })
        .catch(error => {
            console.error('Fetchエラー:', error);
            alert('キャンセルリクエスト送信中にエラーが発生しました。\n' + error.message);
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = 'この内容でキャンセルする';
        });
    });
});
