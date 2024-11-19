document.addEventListener("DOMContentLoaded", () => {
    let selectedTable = null; // เก็บโต๊ะที่เลือก

    // ตรวจสอบและดึง username จาก cookie (แทนที่ sessionStorage)
    const usernameElement = document.querySelector(".username");
    const username = getCookie('username'); // ดึง username จาก cookie
    if (username) {
        usernameElement.textContent = `สวัสดีคุณ ${username}`;
    } else {
        // หากไม่มี username ให้แสดงข้อความแจ้งเตือนและเปลี่ยนไปหน้า login.html
        alert("กรุณาเข้าสู่ระบบก่อน!");
        window.location.href = "login.html"; // หรือเปลี่ยนเส้นทางไปยังหน้าล็อกอิน
    }

    // ฟังก์ชันเพื่อดึงค่า cookie
    function getCookie(name) {
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(name + "=") == 0) {
                return c.substring(name.length + 1, c.length);
            }
        }
        return "";
    }

    // เพิ่ม event listener ให้แต่ละโต๊ะ
    const tables = document.querySelectorAll(".table");
    tables.forEach((table) => {
        table.addEventListener("click", () => {
            // เอา class .selected ออกจากโต๊ะก่อนหน้า
            tables.forEach((t) => t.classList.remove("selected"));

            // เพิ่ม class .selected ให้โต๊ะที่คลิก
            table.classList.add("selected");

            // บันทึก ID ของโต๊ะที่เลือก
            selectedTable = table.textContent;
        });
    });

    // เมื่อกดปุ่ม "จองโต๊ะ"
    const reserveButton = document.querySelector(".reserve-button");
    reserveButton.addEventListener("click", () => {
        if (selectedTable) {
            // ส่งข้อมูลการจองโต๊ะไปยังเซิร์ฟเวอร์
            fetch('/reserveTable', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    table: selectedTable
                })
            })
            .then(response => {
                if (response.ok) {
                    // Success - Show the success alert and navigate to the menu
                    alert("จองโต๊ะสำเร็จ!");
                    window.location.href = "menu.html"; // เปลี่ยนไปหน้าเมนู
                } else {
                    // Handle the error response from the server
                    return response.json();
                }
            })
            .then(data => {
                if (data && data.error) {
                    // Show the error message returned by the server
                    alert(data.error);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("เกิดข้อผิดพลาดในการจองโต๊ะ.");
            });
        } else {
            alert("โปรดเลือกโต๊ะก่อนจอง!");
        }
    });
});
