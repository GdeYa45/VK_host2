const pages = ["ServiceFeed", "ServiceDetail", "CreateService", "UserProfile", "BarterChat"];
const services = [
  {
    id: 1,
    title: "Web design",
    description: "Design a landing page.",
    category: "Design",
    images: ["https://via.placeholder.com/300"],
    owner: "me",
  },
  {
    id: 2,
    title: "Guitar lessons",
    description: "Beginner guitar lessons.",
    category: "Music",
    images: ["https://via.placeholder.com/300"],
    owner: "alex",
  },
];
let currentService = null;
let chats = {};

vkBridge.send("VKWebAppInit");

function showPage(id) {
  pages.forEach((p) =>
    document.getElementById(p).classList.remove("active")
  );
  document.getElementById(id).classList.add("active");
}

function renderServiceFeed() {
  const page = document.getElementById("ServiceFeed");
  page.innerHTML = `
    <header>
      <h2>Услуги</h2>
      <div>
        <button id="createServiceBtn">Добавить</button>
        <button id="profileBtn">Профиль</button>
      </div>
    </header>
    <input type="text" id="searchInput" placeholder="Поиск..." />
    <select id="categoryFilter">
      <option value="">Все категории</option>
      ${[...new Set(services.map((s) => s.category))
        ].map((c) => `<option value="${c}">${c}</option>`)
        .join("")}
    </select>
    <div class="service-grid" id="serviceGrid"></div>
  `;

  document.getElementById("createServiceBtn").onclick = () => {
    renderCreateService();
    showPage("CreateService");
  };
  document.getElementById("profileBtn").onclick = () => {
    renderUserProfile();
    showPage("UserProfile");
  };

  document.getElementById("searchInput").oninput = renderCards;
  document.getElementById("categoryFilter").onchange = renderCards;
  renderCards();

  function renderCards() {
    const grid = document.getElementById("serviceGrid");
    const search = document
      .getElementById("searchInput")
      .value.toLowerCase();
    const cat = document.getElementById("categoryFilter").value;
    grid.innerHTML = "";
    services
      .filter((s) => s.title.toLowerCase().includes(search))
      .filter((s) => !cat || s.category === cat)
      .forEach((s) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `<img src="${s.images[0]}" alt="${s.title}" />
          <h3>${s.title}</h3>
          <p>${s.category}</p>`;
        card.onclick = () => {
          currentService = s;
          renderServiceDetail();
          showPage("ServiceDetail");
        };
        grid.appendChild(card);
      });
  }
}

function renderServiceDetail() {
  if (!currentService) return;
  const s = currentService;
  const page = document.getElementById("ServiceDetail");
  page.innerHTML = `
    <button id="backBtn">Назад</button>
    <h2>${s.title}</h2>
    <p>${s.description}</p>
    <div class="gallery">
      ${s.images.map((src) => `<img src="${src}" alt="${s.title}" />`).join("")}
    </div>
    <button id="barterBtn">Предложить обмен</button>
  `;
  document.getElementById("backBtn").onclick = () => {
    renderServiceFeed();
    showPage("ServiceFeed");
  };
  document.getElementById("barterBtn").onclick = () => {
    openChat(s.id);
    renderBarterChat(s.id);
    showPage("BarterChat");
  };
}

function renderCreateService() {
  const page = document.getElementById("CreateService");
  page.innerHTML = `
    <button id="backBtn">Назад</button>
    <h2>Создать услугу</h2>
    <form id="serviceForm">
      <input name="title" placeholder="Название" required />
      <textarea name="description" placeholder="Описание" required></textarea>
      <input name="category" placeholder="Категория" required />
      <input name="photo" placeholder="URL фото" required />
      <button type="submit">Создать</button>
    </form>
  `;
  document.getElementById("backBtn").onclick = () => {
    renderServiceFeed();
    showPage("ServiceFeed");
  };
  document.getElementById("serviceForm").onsubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const newService = {
      id: Date.now(),
      title: form.title.value,
      description: form.description.value,
      category: form.category.value,
      images: [form.photo.value],
      owner: "me",
    };
    services.push(newService);
    renderServiceFeed();
    showPage("ServiceFeed");
  };
}

function renderUserProfile() {
  const page = document.getElementById("UserProfile");
  const my = services.filter((s) => s.owner === "me");
  const active = Object.keys(chats).map((id) =>
    services.find((s) => s.id == id)
  );
  page.innerHTML = `
    <button id="backBtn">Назад</button>
    <h2>Профиль</h2>
    <div class="tab-header">
      <button id="tabServices" class="active">Мои услуги</button>
      <button id="tabTrades">Активные обмены</button>
    </div>
    <div id="tabContent"></div>
  `;
  document.getElementById("backBtn").onclick = () => {
    renderServiceFeed();
    showPage("ServiceFeed");
  };
  const tabServices = document.getElementById("tabServices");
  const tabTrades = document.getElementById("tabTrades");
  const content = document.getElementById("tabContent");
  tabServices.onclick = () => setTab("services");
  tabTrades.onclick = () => setTab("trades");

  function setTab(tab) {
    tabServices.classList.toggle("active", tab === "services");
    tabTrades.classList.toggle("active", tab === "trades");
    if (tab === "services") {
      content.innerHTML =
        my.map((s) => `<div class="card">${s.title}</div>`).join("") ||
        "Нет услуг";
    } else {
      content.innerHTML =
        active.map((s) => `<div class="card">${s.title}</div>`).join("") ||
        "Нет обменов";
    }
  }
  setTab("services");
}

let currentChat = null;
function openChat(serviceId) {
  if (!chats[serviceId]) chats[serviceId] = [];
  currentChat = serviceId;
}

function renderBarterChat(serviceId) {
  const msgs = chats[serviceId] || [];
  const service = services.find((s) => s.id === serviceId);
  const page = document.getElementById("BarterChat");
  page.innerHTML = `
    <button id="backBtn">Назад</button>
    <h3>Обмен: ${service.title}</h3>
    <div class="chat-messages" id="chatMessages"></div>
    <div class="chat-input">
      <input type="text" id="chatInput" placeholder="Сообщение" />
      <button id="sendBtn">Отправить</button>
    </div>
  `;
  document.getElementById("backBtn").onclick = () => {
    renderServiceDetail();
    showPage("ServiceDetail");
  };
  const container = document.getElementById("chatMessages");
  msgs.forEach((m) => {
    const div = document.createElement("div");
    div.textContent = m;
    container.appendChild(div);
  });
  document.getElementById("sendBtn").onclick = () => {
    const val = document.getElementById("chatInput").value;
    if (val.trim()) {
      msgs.push(val);
      const div = document.createElement("div");
      div.textContent = val;
      container.appendChild(div);
      document.getElementById("chatInput").value = "";
    }
  };
}

renderServiceFeed();
showPage("ServiceFeed");
