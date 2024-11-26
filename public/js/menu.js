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

    

    // เพิ่มเมนูใหม่
    const addMenuBtn = document.getElementById('add-menu-btn');
    const formContainer = document.getElementById('new-menu-form-container');

    addMenuBtn.addEventListener('click', () => {
        createForm();
    });

    const createForm = () => {
        formContainer.innerHTML = `
            <form id="new-menu-form" class="new-menu-form">
                <div class="form-group">
                    <label for="menu-name">ชื่อเมนู:</label>
                    <input type="text" id="menu-name" name="menuName" required>
                </div>
                <div class="form-group">
                    <label for="menu-price">ราคา:</label>
                    <input type="number" id="menu-price" name="menuPrice" min="0" required>
                </div>
                <div class="form-group">
                    <label for="menu-image">รูปภาพ:</label>
                    <input type="file" id="menu-image" name="menuImage" accept="image/*" required>
                </div>
                <button type="submit">เพิ่มเมนู</button>
                <button type="button" id="cancel-form-btn">ยกเลิก</button>
            </form>
        `;

        const cancelFormBtn = document.getElementById('cancel-form-btn');
        cancelFormBtn.addEventListener('click', () => {
            formContainer.innerHTML = '';
        });

        const form = document.getElementById('new-menu-form');
        form.addEventListener('submit', handleFormSubmit);
    };

    const handleFormSubmit = (event) => {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        fetch('/addMenu', {
            method: 'POST',
            body: formData,
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    alert('เพิ่มเมนูสำเร็จ');
                    form.reset();
                    document.getElementById('new-menu-form-container').innerHTML = '';
                    loadMenu(); // รีเฟรชเมนูหลังจากเพิ่ม
                } else {
                    alert(`เกิดข้อผิดพลาด: ${data.message}`);
                }
            })
            .catch((error) => {
                console.error('Error adding menu:', error);
                alert('เกิดข้อผิดพลาดในการเพิ่มเมนู');
            });
    };

    // ฟังก์ชันโหลดเมนูจากฐานข้อมูล
const loadMenu = () => {
    fetch('/getMenu')
        .then((response) => response.json())
        .then((data) => {
            const menuList = document.getElementById('menu-list');
            menuList.innerHTML = ''; // เคลียร์รายการเมนูเดิม
            data.menu.forEach(item => {
                menuList.innerHTML += `
                    <div class="food-item featured" data-menu-id="${item.menuID}">
                        <div class="food-img">
                            <img src="/pic/${item.menuImage}" alt="${item.menuName}">
                        </div>
                        <div class="food-content">
                            <h2 class="food-name">${item.menuName}</h2>
                            <div class="line"></div>
                            <h3 class="food-price">${item.menuPrice}-</h3>
                            <button class="button_orders" id="select4">เลือก</button>
                        </div>
                    </div>
                `;
            });
        })
        .catch((error) => {
            console.error('Error loading menu:', error);
        });
};

// ใช้ event delegation เพื่อตรวจจับการกดปุ่มจาก element ใหม่ที่ถูกเพิ่มเข้ามา
document.getElementById('menu-list').addEventListener('click', (event) => {
    if (event.target && event.target.classList.contains('button_orders')) {
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
            body: JSON.stringify({ menuID, receiptID }),  // ส่งข้อมูลไปที่เซิร์ฟเวอร์
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    alert("เพิ่มรายการสำเร็จ!");

                    // เปลี่ยนสถานะของปุ่มเมื่อเพิ่มรายการสำเร็จ
                    event.target.textContent = "เลือกแล้ว";
                    event.target.style.backgroundColor = "#4a221c";
                    event.target.style.cursor = "not-allowed";
                    event.target.disabled = true;
                } else {
                    alert("ไม่สามารถเพิ่มรายการได้");
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                alert("เกิดข้อผิดพลาดในการเพิ่มรายการ โปรดลองอีกครั้ง!");
            });
    }
});

// เรียกใช้ loadMenu เมื่อหน้าโหลดเสร็จ
loadMenu(); // โหลดเมนูทันที

});
