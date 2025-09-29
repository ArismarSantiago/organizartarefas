// key do localStorage
const STORAGE_KEY = "todolist_tasks_v1";

// elementos
const form = document.getElementById("taskForm");
const titleInput = document.getElementById("title");
const dateInput = document.getElementById("date");
const descInput = document.getElementById("description");
const taskList = document.getElementById("taskList");
const saveBtn = document.getElementById("saveBtn");
const cancelEditBtn = document.getElementById("cancelEdit");
const searchInput = document.getElementById("search");
const filterSelect = document.getElementById("filter");
const clearAllBtn = document.getElementById("clearAll");

let tasks = []; // array de tasks
let editId = null; // id em edição

// util: formata yyyy-mm-dd -> dd/mm/yyyy
function formatDateISO(iso){
  if(!iso) return "";
  const [y,m,d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// carregar do localStorage
function loadTasks(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error("Erro ao ler LocalStorage", e);
    tasks = [];
  }
}

// salvar no localStorage
function saveTasks(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  render();
}

// criar id simples
function newId(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

// renderizar lista com filtros/pesquisa
function render(){
  const q = searchInput.value.trim().toLowerCase();
  const filter = filterSelect.value;

  // ordenar por data (mais próxima primeiro), tarefas sem data vão pro final
  const sorted = [...tasks].sort((a,b)=>{
    if(!a.date && !b.date) return 0;
    if(!a.date) return 1;
    if(!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  taskList.innerHTML = "";
  for(const t of sorted){
    // filtros
    if(filter === "pending" && t.done) continue;
    if(filter === "done" && !t.done) continue;
    // busca
    if(q){
      const combined = `${t.title} ${t.description}`.toLowerCase();
      if(!combined.includes(q)) continue;
    }

    const li = document.createElement("li");
    li.className = "task" + (t.done ? " done" : "");
    li.dataset.id = t.id;

    // conteúdo
    li.innerHTML = `
      <div>
        <div class="meta">
          <div class="title">${escapeHtml(t.title)}</div>
          <div class="date">${t.date ? formatDateISO(t.date) : "Sem data"}</div>
        </div>
        <div class="description">${escapeHtml(t.description || "")}</div>
      </div>
      <div class="actions">
        <button class="icon-btn complete" title="Marcar conclusão">${t.done ? "↺" : "✔"}</button>
        <button class="icon-btn edit" title="Editar">✎</button>
        <button class="icon-btn delete" title="Excluir">✖</button>
      </div>
    `;

    // delegação simples dos botões
    const completeBtn = li.querySelector(".complete");
    const editBtn = li.querySelector(".edit");
    const deleteBtn = li.querySelector(".delete");

    completeBtn.addEventListener("click", () => toggleDone(t.id));
    editBtn.addEventListener("click", () => startEdit(t.id));
    deleteBtn.addEventListener("click", () => removeTask(t.id));

    taskList.appendChild(li);
  }
}

// escape simples para evitar injeção na renderização
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'", "&#39;");
}

// adicionar nova task
function addTask(e){
  e.preventDefault();
  const title = titleInput.value.trim();
  const date = dateInput.value || "";
  const description = descInput.value.trim();

  if(!title){
    alert("Coloque o nome da atividade.");
    return;
  }

  if(editId){
    // editar existente
    const idx = tasks.findIndex(t => t.id === editId);
    if(idx !== -1){
      tasks[idx].title = title;
      tasks[idx].date = date;
      tasks[idx].description = description;
    }
    editId = null;
    saveBtn.textContent = "Adicionar";
    cancelEditBtn.classList.add("hidden");
  } else {
    const task = {
      id: newId(),
      title,
      date,
      description,
      done: false,
      createdAt: new Date().toISOString()
    };
    tasks.push(task);
  }

  // reset do form
  form.reset();
  saveTasks();
}

// alternar concluída
function toggleDone(id){
  const t = tasks.find(x => x.id === id);
  if(!t) return;
  t.done = !t.done;
  saveTasks();
}

// remover
function removeTask(id){
  if(!confirm("Confirma excluir esta tarefa?")) return;
  tasks = tasks.filter(x => x.id !== id);
  saveTasks();
}

// iniciar edição: preenche o form
function startEdit(id){
  const t = tasks.find(x => x.id === id);
  if(!t) return;
  titleInput.value = t.title;
  dateInput.value = t.date || "";
  descInput.value = t.description || "";
  editId = id;
  saveBtn.textContent = "Salvar edição";
  cancelEditBtn.classList.remove("hidden");
  window.scrollTo({top:0, behavior:"smooth"});
}

// cancelar edição
function cancelEdit(){
  editId = null;
  form.reset();
  saveBtn.textContent = "Adicionar";
  cancelEditBtn.classList.add("hidden");
}

// limpar tudo
function clearAll(){
  if(!confirm("Deseja realmente apagar todas as tarefas salvas localmente?")) return;
  tasks = [];
  saveTasks();
}

// eventos
form.addEventListener("submit", addTask);
cancelEditBtn.addEventListener("click", cancelEdit);
searchInput.addEventListener("input", render);
filterSelect.addEventListener("change", render);
clearAllBtn.addEventListener("click", clearAll);

// inicialização
loadTasks();
render();