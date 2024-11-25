document.addEventListener("DOMContentLoaded", () => {
    let selectedTable = null; // เก็บ ID ของโต๊ะที่เลือก

    // ตรวจสอบและดึง username จาก cookie
    const usernameElement = document.querySelector(".username");
    const username = getCookie('username');
    if (username) {
        usernameElement.textContent = `สวัสดีคุณ ${username}`;
    } else {
        alert("กรุณาเข้าสู่ระบบก่อน!");
        window.location.href = "login.html";
    }

    // ฟังก์ชันสำหรับดึงค่า cookie
    function getCookie(name) {
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookies = decodedCookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(`${name}=`)) {
                return cookie.substring(name.length + 1);
            }
        }
        return "";
    }

    // เพิ่ม event listener ให้กับโต๊ะทั้งหมด
    const tables = document.querySelectorAll(".table");
    tables.forEach((table) => {
        table.addEventListener("click", () => {
            // ลบ class .selected ออกจากโต๊ะที่เลือกไว้ก่อนหน้า
            tables.forEach((t) => t.classList.remove("selected"));

            // เพิ่ม class .selected ให้โต๊ะที่ถูกคลิก
            table.classList.add("selected");

            // บันทึก ID ของโต๊ะที่เลือก
            selectedTable = table.getAttribute("data-id");
        });
    });

    // เมื่อกดปุ่ม "จองโต๊ะ"
    const reserveButton = document.querySelector(".reserve-button");
    reserveButton.addEventListener("click", () => {
        if (selectedTable) {
            // บันทึก ID ของโต๊ะลงใน cookie
            document.cookie = `tableID=${selectedTable}; path=/;`;

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
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // จดจำ receiptID ใน cookie
                    document.cookie = `receiptID=${data.receiptID}; path=/;`;
                    alert("จองโต๊ะสำเร็จ!");
                    window.location.href = "menu.html"; // ไปยังหน้าเมนู
                } else {
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
