document.addEventListener("DOMContentLoaded", () => {
    fetch('/getUserData')
        .then(response => response.json())
        .then(data => {
            if (data.username) {
                document.querySelector('.username').textContent = `คุณ ${data.username}`;

                // ดึงประวัติการสั่งซื้อจาก server
                fetch(`/getOrderHistory/${data.username}`)
                    .then(response => response.json())
                    .then(orders => {
                        const orderSection = document.querySelector('.order-section');
                        if (orders.length > 0) {
                            orders.forEach((order, index) => {
                                if (index < 3) { // แสดงแค่ 3 รายการล่าสุด
                                    const orderDiv = document.createElement('div');
                                    orderDiv.classList.add('order-item');
                                    orderDiv.textContent = `${order.tableID} - ${order.totalPrice} Bath`;
                                    orderSection.appendChild(orderDiv);
                                }
                            });
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching order history:", error);
                    });

                // ดึงรายการเมนูที่สร้างโดยผู้ใช้
                fetch(`/getMenu`)
                    .then(response => response.json())
                    .then(menuData => {
                        const menuList = document.querySelector('.menu-section .menu-list');
                        const userMenus = menuData.menu.filter(menu => menu.menuCreator === data.username);

                        if (userMenus.length > 0) {
                            userMenus.forEach(menu => {
                                const menuItem = document.createElement('div');
                                menuItem.classList.add('menu-item');
                                menuItem.innerHTML = `
                                    <div class="menu-img">
                                        <img src="pic/${menu.menuImage}" alt="${menu.menuName}">
                                    </div>
                                    <div class="menu-info">
                                        <h3>${menu.menuName}</h3>
                                        <p>ราคา: ${menu.menuPrice} บาท</p>
                                    </div>
                                `;
                                menuList.appendChild(menuItem);
                            });
                        } else {
                            menuList.textContent = "ไม่มีเมนูที่คุณสร้าง";
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching user's created menu:", error);
                    });
            }
        })
        .catch(error => {
            console.error("Error fetching user data:", error);
        });
});