document.addEventListener("DOMContentLoaded", async () => {
    const checkBillDiv = document.querySelector(".allorder");

    // ดึงข้อมูล receiptID จาก cookies
    const receiptID = getCookie("receiptID");

    if (!receiptID) {
        alert("No receipt ID found in cookies");
        return;
    }

    try {
        // ดึงข้อมูลจากเซิร์ฟเวอร์เพื่อรับข้อมูลบิล
        const response = await fetch(`/getBill/${receiptID}`);
        const data = await response.json();

        if (data.error) {
            checkBillDiv.innerHTML = `<p>${data.error}</p>`;
            return;
        }

        let total = 0;
        let billHtml = "";

        // สร้างบิลจากข้อมูลที่ได้รับ
        data.orders.forEach(order => {
            billHtml += ` 
                <h2>${order.menuName}            ${order.menuPrice} Bath</h2>
            `;
            total += order.menuPrice;
        });

        // แสดงราคาทั้งหมด
        billHtml += `
            <h2>Total            ${data.totalPrice} Bath</h2>
        `;

        checkBillDiv.innerHTML = billHtml;
    } catch (error) {
        console.error("Error fetching bill data:", error);
    }
});

// ฟังก์ชันในการดึงค่า receiptID จาก cookies
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}
