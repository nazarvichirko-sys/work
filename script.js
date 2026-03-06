const API_BASE = "https://workbot-production-2bb8.up.railway.app";

let selectedTicket = "";
let selectedPrice = 0;
let selectedCount = 1;

const params = new URLSearchParams(window.location.search);
const ref = params.get("ref") || "";

if (ref) {
  const note = document.getElementById("refNote");
  note.style.display = "block";
}

function openInfo(title, html) {
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("infoModal").style.display = "flex";
}

function closeInfo() {
  document.getElementById("infoModal").style.display = "none";
}

function openTiming() {
  openInfo("Таймінг", `
    <p>19:30 — збір гостей</p>
    <p>20:00 — початок шоу</p>
    <p>20:10 — блок 1</p>
    <p>21:50 — перерва</p>
    <p>22:10 — блок 2</p>
    <p>23:45 — завершення</p>
  `);
}

function openRules() {
  openInfo("Правила", `
    <p>• не перебиваємо коміків</p>
    <p>• без повної відеозйомки</p>
    <p>• без спалаху</p>
    <p>• тихий вхід якщо запізнився</p>
  `);
}

function openTickets() {
  openInfo("Квитки", `
    <p>Стандарт — 1500 грн</p>
    <p>Хороші місця — 2000 грн</p>
    <p>VIP — 3000 грн</p>
  `);
}

function openBuy() {
  document.getElementById("buyModal").style.display = "flex";
}

function closeBuy() {
  document.getElementById("buyModal").style.display = "none";
  document.getElementById("ticketSelect").style.display = "block";
  document.getElementById("payment").style.display = "none";
}

function selectTicket(name, price) {
  selectedTicket = name;
  selectedPrice = price;
  selectedCount = 1;

  document.getElementById("ticketSelect").style.display = "none";
  document.getElementById("payment").style.display = "block";
  document.getElementById("ticketCount").value = 1;

  updateTotal();
}

function updateTotal() {
  const countInput = document.getElementById("ticketCount");
  let count = parseInt(countInput.value, 10);

  if (!count || count < 1) count = 1;

  selectedCount = count;

  const total = selectedPrice * selectedCount;

  document.getElementById("ticketInfo").innerText =
    `${selectedTicket} — ${selectedPrice} грн × ${selectedCount}`;

  document.getElementById("totalPriceText").innerText =
    `До сплати: ${total} грн`;
}

function setStatus(status) {
  const wrap = document.getElementById("statusWrap");
  const text = document.getElementById("statusText");

  wrap.style.display = "block";
  text.classList.remove("statusPending", "statusAccepted", "statusDeclined");

  if (status === "pending") {
    text.classList.add("statusPending");
    text.innerText = "⏳ Очікуємо підтвердження...";
  } else if (status === "accepted") {
    text.classList.add("statusAccepted");
    text.innerText = "✅ Оплату підтверджено";
  } else if (status === "declined") {
    text.classList.add("statusDeclined");
    text.innerText = "❌ Оплату відхилено";
  } else {
    text.classList.add("statusPending");
    text.innerText = "⏳ Очікуємо підтвердження...";
  }
}

function showTicket(ticket) {
  document.getElementById("ticketWrap").style.display = "block";

  document.getElementById("ticketEvent").innerText = ticket.event;
  document.getElementById("ticketDate").innerText = ticket.date;
  document.getElementById("ticketTime").innerText = ticket.time;
  document.getElementById("ticketAddress").innerText = ticket.address;
  document.getElementById("ticketType").innerText = ticket.type;
  document.getElementById("ticketCountView").innerText = ticket.count;
  document.getElementById("ticketPrice").innerText = `${ticket.price} грн`;
  document.getElementById("ticketName").innerText = ticket.name;
  document.getElementById("ticketPhone").innerText = ticket.phone;
  document.getElementById("ticketCode").innerText = ticket.code;
}

function checkStatus(orderId) {
  setStatus("pending");

  const interval = setInterval(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status/${orderId}`);
      const data = await res.json();

      if (data.status === "accepted") {
        setStatus("accepted");
        showTicket(data.ticket);
        clearInterval(interval);
      }

      if (data.status === "declined") {
        setStatus("declined");
        clearInterval(interval);
      }
    } catch (e) {}
  }, 3000);
}

async function sendReceipt() {
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim().replace(/\D/g, "");
  const file = document.getElementById("receipt").files[0];

  if (!ref) {
    alert("Це посилання не містить ref. Відкрий сайт саме по персональній ссилці з Telegram.");
    return;
  }

  if (!selectedTicket || !selectedPrice) {
    alert("Оберіть квиток");
    return;
  }

  if (!name || !phone || !file) {
    alert("Заповни всі поля");
    return;
  }

  const totalPrice = selectedPrice * selectedCount;

  const formData = new FormData();
  formData.append("ref", ref);
  formData.append("ticket", selectedTicket);
  formData.append("price", totalPrice);
  formData.append("count", selectedCount);
  formData.append("name", name);
  formData.append("phone", phone);
  formData.append("receipt", file);

  try {
    const res = await fetch(`${API_BASE}/api/receipt`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.ok) {
      closeBuy();
      checkStatus(data.order_id);
      alert("Квитанція відправлена");
    } else {
      alert("Помилка: " + (data.error ? JSON.stringify(data.error) : "невідома"));
    }
  } catch (e) {
    alert("Сервер недоступний");
  }
}
