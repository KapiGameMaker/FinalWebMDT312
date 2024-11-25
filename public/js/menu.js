document.addEventListener("DOMContentLoaded", () => {
    // ฟังก์ชันสำหรับดึงค่า tableID และ receiptID จาก cookie
    function getCookieValue(cookieName) {
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookies = decodedCookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(`${cookieName}=`)) {
                return cookie.substring(`${cookieName}=`.length);
            }
        }
        return null;
    }

    const tableID = getCookieValue("tableID");
    const receiptID = getCookieValue("receiptID");

    // ค้นหา element h2 แล้วแทนข้อความ "โต๊ะ ### ID: ###" ด้วย tableID และ receiptID
    if (tableID && receiptID) {
        const tableHeader = document.querySelector(".menu-head h2");
        if (tableHeader) {
            tableHeader.textContent = `โต๊ะ ${tableID} ID: ${receiptID}`;
        }
    } else {
        // กรณีไม่มี tableID หรือ receiptID ให้ redirect ไปยังหน้าเลือกโต๊ะ
        alert("กรุณาเลือกโต๊ะก่อน!");
        window.location.href = "reserve-table.html"; // ลิงก์ไปหน้าที่ใช้เลือกโต๊ะ
    }

    // ฟังก์ชันสำหรับจัดการการกดปุ่มเพิ่มรายการอาหาร
    const buttons = document.querySelectorAll(".button_orders");
    buttons.forEach((button) => {
        button.addEventListener("click", (event) => {
            const foodItem = event.target.closest(".food-item");
            const foodName = foodItem.querySelector(".food-name").textContent;
            const menuID = foodItem?.getAttribute("data-menu-id");
    
            if (!menuID) {
                alert("ไม่พบข้อมูลเมนู กรุณาลองอีกครั้ง!");
                return;
            }
    
            if (!receiptID) {
                alert("ไม่พบข้อมูลใบเสร็จ กรุณาเลือกโต๊ะอีกครั้ง!");
                return;
            }
    
            fetch('/addOrder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ menuID, receiptID }),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        alert("เพิ่มรายการสำเร็จ!");
                        
                        // เปลี่ยนสถานะของปุ่มเมื่อเพิ่มรายการสำเร็จ
                        button.textContent = "เลือกแล้ว";
                        button.style.backgroundColor = "#4a221c";
                        button.style.cursor = "not-allowed";
                        button.disabled = true;
                    } else {
                        alert("ไม่สามารถเพิ่มรายการได้");
                    }
                })
                .catch((error) => {
                    console.error("Error:", error);
                    alert("เกิดข้อผิดพลาดในการเพิ่มรายการ โปรดลองอีกครั้ง!");
                });
        });
    });
    
});
