import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Bell, CalendarDays, ChevronDown, CreditCard, DollarSign,
  Download, Edit3, FileText, Filter, LayoutDashboard, LogOut, Menu,
  Moon, PiggyBank, Plus, Search, Settings, Sun, Trash2, TrendingDown,
  TrendingUp, Wallet, X
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "./api";

const categories = ["Food", "Transport", "Housing", "Entertainment", "Shopping", "Education", "Health", "Salary", "Freelance", "Other"];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

function money(value) { return currency.format(Number(value) || 0); }

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function calculateEMI(principal, annualRate, months) {
  principal = Number(principal);
  annualRate = Number(annualRate);
  months = Number(months);
  if (!principal || !months) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / months;
  return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
}

function App() {
  const [tokenReady, setTokenReady] = useState(Boolean(localStorage.getItem("finora_token")));
  const [user, setUser] = useState(null);

  if (!tokenReady) {
    return <AuthScreen onAuthenticated={(result) => {
      localStorage.setItem("finora_token", result.token);
      setUser(result.user);
      setTokenReady(true);
    }} />;
  }

  return (
    <AuthenticatedApp
      user={user}
      setUser={setUser}
      logout={() => {
        localStorage.removeItem("finora_token");
        setUser(null);
        setTokenReady(false);
      }}
    />
  );
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = mode === "login"
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      onAuthenticated(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-icon">₹</div>
          <div><strong>Finora</strong><span>Finance OS</span></div>
        </div>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-subtitle">
          {mode === "login" ? "Sign in to access your finances." : "Your data will be stored in your database."}
        </p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <label>Name
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your name" required />
            </label>
          )}
          <label>Email
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@example.com" required />
          </label>
          <label>Password
            <input type="password" minLength="6" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Minimum 6 characters" required />
          </label>
          <button className="primary-btn auth-submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button className="switch-auth" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

function AuthenticatedApp({ user, setUser, logout }) {
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState({ transactions: [], budgets: [], loans: [], investments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [transactions, budgets, loans, investments] = await Promise.all([
          api.transactions.list(), api.budgets.list(), api.loans.list(), api.investments.list()
        ]);
        setData({ transactions, budgets, loans, investments });
      } catch (err) {
        setError(err.message);
        if (err.message.toLowerCase().includes("token") || err.message.toLowerCase().includes("authentication")) logout();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totals = useMemo(() => {
    const income = data.transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expenses = data.transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    return { income, expenses, balance: income - expenses, savingsRate: income ? ((income - expenses) / income) * 100 : 0 };
  }, [data.transactions]);

  const refresh = async (key) => {
    const value = await api[key].list();
    setData(prev => ({ ...prev, [key]: value }));
  };

  const add = async (key, body) => {
    await api[key].create(body);
    await refresh(key);
  };

  const remove = async (key, id) => {
    await api[key].remove(id);
    await refresh(key);
  };

  if (loading) return <div className="loading-page">Loading your finances...</div>;

  return (
    <div className={dark ? "app dark" : "app"}>
      <Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen} />
      <main className="main">
        <Header page={page} user={user} dark={dark} setDark={setDark} onMenu={() => setSidebarOpen(true)} logout={logout} />
        <div className="content">
          {error && <div className="error-box page-error">{error}</div>}
          {page === "dashboard" && <Dashboard data={data} totals={totals} setPage={setPage} />}
          {page === "transactions" && <Transactions data={data} setData={setData} />}
          {page === "budgets" && <Budgets data={data} add={add} remove={remove} />}
          {page === "loans" && <Loans data={data} add={add} remove={remove} />}
          {page === "investments" && <Investments data={data} totals={totals} add={add} remove={remove} />}
          {page === "reports" && <Reports data={data} totals={totals} />}
          {page === "settings" && <SettingsPage dark={dark} setDark={setDark} logout={logout} />}
        </div>
      </main>
    </div>
  );
}

function Sidebar({ page, setPage, open, setOpen }) {
  const items = [
    ["dashboard", "Dashboard", LayoutDashboard], ["transactions", "Transactions", CreditCard],
    ["budgets", "Budgets", PiggyBank], ["loans", "Loans", Wallet],
    ["investments", "Investments", TrendingUp], ["reports", "Reports", BarChart3]
  ];
  return <>
    {open && <div className="overlay" onClick={() => setOpen(false)} />}
    <aside className={open ? "sidebar open" : "sidebar"}>
      <div className="brand">
        <div className="brand-icon">₹</div><div><strong>Finora</strong><span>Finance OS</span></div>
        <button className="close-mobile" onClick={() => setOpen(false)}><X size={20} /></button>
      </div>
      <nav>
        <p className="nav-label">MAIN</p>
        {items.map(([id, label, Icon]) => (
          <button key={id} className={page === id ? "nav-item active" : "nav-item"} onClick={() => {setPage(id); setOpen(false);}}>
            <Icon size={19} />{label}
          </button>
        ))}
        <p className="nav-label settings-label">SYSTEM</p>
        <button className={page === "settings" ? "nav-item active" : "nav-item"} onClick={() => {setPage("settings"); setOpen(false);}}>
          <Settings size={19} />Settings
        </button>
      </nav>
      <div className="sidebar-tip"><div className="tip-icon">🔐</div><strong>Private by account</strong><p>Your records are stored against your authenticated user.</p></div>
    </aside>
  </>;
}

function Header({ page, user, dark, setDark, onMenu, logout }) {
  const titles = {
    dashboard: ["Dashboard", "Your financial overview."],
    transactions: ["Transactions", "Track every rupee coming in and going out."],
    budgets: ["Budgets", "Keep spending inside the lines."],
    loans: ["Loans & EMI", "Understand what your debt costs."],
    investments: ["Investments", "Track how your money is growing."],
    reports: ["Reports", "Turn spending history into useful information."],
    settings: ["Settings", "Customize your Finora experience."]
  };
  const [title, subtitle] = titles[page];
  return <header className="header">
    <button className="mobile-menu" onClick={onMenu}><Menu size={22} /></button>
    <div><h1>{title}</h1><p>{subtitle}</p></div>
    <div className="header-actions">
      <span className="user-name">{user?.name}</span>
      <button className="icon-btn" onClick={() => setDark(!dark)}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
      <button className="icon-btn" onClick={logout} title="Log out"><LogOut size={19} /></button>
      <div className="avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
    </div>
  </header>;
}

function Dashboard({ data, totals, setPage }) {
  const [showModal, setShowModal] = useState(false);
  const expenseData = useMemo(() => {
    const map = {};
    data.transactions.filter(t => t.type === "expense").forEach(t => { map[t.category] = (map[t.category] || 0) + Number(t.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value-a.value);
  }, [data.transactions]);

  const monthlyData = useMemo(() => {
    const map = {};
    data.transactions.forEach(t => {
      const month = new Date(`${t.date}T00:00:00`).toLocaleDateString("en-IN", {month:"short"});
      if (!map[month]) map[month] = {month, income:0, expense:0};
      if (t.type === "income") map[month].income += Number(t.amount); else map[month].expense += Number(t.amount);
    });
    return Object.values(map).reverse();
  }, [data.transactions]);

  return <>
    <div className="page-top">
      <div><h2>Good morning 👋</h2><p>Your account starts empty, because this time the numbers are actually yours.</p></div>
      <button className="primary-btn" onClick={() => setShowModal(true)}><Plus size={17}/> Add transaction</button>
    </div>
    {showModal && <TransactionModal onClose={() => setShowModal(false)} />}
    <div className="stats-grid">
      <StatCard icon={Wallet} label="Total balance" value={money(totals.balance)} trend="Available balance"/>
      <StatCard icon={TrendingUp} label="Total income" value={money(totals.income)} trend="Money in" positive/>
      <StatCard icon={TrendingDown} label="Total expenses" value={money(totals.expenses)} trend="Money out" negative/>
      <StatCard icon={PiggyBank} label="Savings rate" value={`${Math.max(0, totals.savingsRate).toFixed(1)}%`} trend="Income saved" positive/>
    </div>
    <div className="chart-grid">
      <section className="panel large-panel"><div className="panel-heading"><div><h3>Income vs expenses</h3><span>Based on your database records</span></div><CalendarDays size={19}/></div>
        <div className="chart-box">{monthlyData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis tickFormatter={v=>`₹${v/1000}k`}/><Tooltip formatter={v=>money(v)}/><Legend/><Bar dataKey="income" name="Income" radius={[5,5,0,0]}/><Bar dataKey="expense" name="Expenses" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer> : <EmptyState text="Add transactions to see your chart."/>}</div>
      </section>
      <section className="panel"><div className="panel-heading"><div><h3>Spending by category</h3><span>Your recorded expenses</span></div></div>
        <div className="chart-box pie">{expenseData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={expenseData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={95} paddingAngle={3}>{expenseData.map((_,i)=><Cell key={i}/>)}</Pie><Tooltip formatter={v=>money(v)}/><Legend/></PieChart></ResponsiveContainer> : <EmptyState text="No expenses yet."/>}</div>
      </section>
    </div>
    <section className="panel"><div className="panel-heading"><div><h3>Recent transactions</h3><span>Your latest database activity</span></div><button className="text-btn" onClick={()=>setPage("transactions")}>View all</button></div><TransactionTable transactions={data.transactions.slice(0,5)}/></section>
  </>;
}

function StatCard({icon:Icon,label,value,trend,positive,negative}) {
  return <div className="stat-card"><div className="stat-top"><div className="stat-icon"><Icon size={20}/></div>{positive&&<span className="trend up">↗</span>}{negative&&<span className="trend down">↘</span>}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><small>{trend}</small></div>;
}

function Transactions({data,setData}) {
  const [search,setSearch]=useState(""); const [filterType,setFilterType]=useState("all"); const [modal,setModal]=useState(false); const [editing,setEditing]=useState(null);
  const filtered=data.transactions.filter(t=>filterType==="all"||t.type===filterType).filter(t=>`${t.title} ${t.category}`.toLowerCase().includes(search.toLowerCase()));
  const save=async transaction=>{
    try {
      const saved=editing?await api.transactions.update(editing._id,transaction):await api.transactions.create(transaction);
      setData(prev=>({ ...prev, transactions: editing?prev.transactions.map(t=>t._id===saved._id?saved:t):[saved,...prev.transactions] }));
      setModal(false); setEditing(null);
    } catch(e){alert(e.message);}
  };
  const del=async id=>{if(!confirm("Delete this transaction?"))return; try{await api.transactions.remove(id);setData(p=>({...p,transactions:p.transactions.filter(t=>t._id!==id)}));}catch(e){alert(e.message);}};
  function exportCSV(){const csv=[["Title","Type","Category","Amount","Date","Note"],...data.transactions.map(t=>[t.title,t.type,t.category,t.amount,t.date,t.note||""])].map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="finora-transactions.csv";a.click();}
  return <><div className="page-top"><div><h2>Transactions</h2><p>{filtered.length} matching transactions</p></div><div className="button-row"><button className="secondary-btn" onClick={exportCSV}><Download size={17}/> CSV</button><button className="primary-btn" onClick={()=>{setEditing(null);setModal(true)}}><Plus size={17}/> Add transaction</button></div></div>
    <section className="panel"><div className="filters"><div className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions..."/></div><div className="select-box"><Filter size={17}/><select value={filterType} onChange={e=>setFilterType(e.target.value)}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expenses</option></select><ChevronDown size={16}/></div></div><TransactionTable transactions={filtered} editable onEdit={t=>{setEditing(t);setModal(true)}} onDelete={del}/></section>
    {modal&&<TransactionModal transaction={editing} onClose={()=>{setModal(false);setEditing(null)}} onSave={save}/>}</>;
}

function TransactionTable({transactions,editable,onEdit,onDelete}) {
  if(!transactions.length)return <EmptyState text="No transactions yet. Add your first one."/>; return <div className="table-wrap"><table><thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th>Amount</th>{editable&&<th>Actions</th>}</tr></thead><tbody>{transactions.map(t=><tr key={t._id}><td><div className="transaction-name"><div className={t.type==="income"?"transaction-icon income":"transaction-icon expense"}>{t.type==="income"?<TrendingUp size={17}/>:<TrendingDown size={17}/>}</div><div><strong>{t.title}</strong>{t.note&&<small>{t.note}</small>}</div></div></td><td><span className="category">{t.category}</span></td><td>{formatDate(t.date)}</td><td className={t.type==="income"?"amount income-text":"amount expense-text"}>{t.type==="income"?"+":"-"}{money(t.amount)}</td>{editable&&<td><div className="action-buttons"><button onClick={()=>onEdit(t)}><Edit3 size={16}/></button><button onClick={()=>onDelete(t._id)}><Trash2 size={16}/></button></div></td>}</tr>)}</tbody></table></div>;
}

function TransactionModal({transaction,onClose,onSave}) {
  const [form,setForm]=useState(transaction?{...transaction}:{title:"",amount:"",type:"expense",category:"Food",date:new Date().toISOString().slice(0,10),note:""});
  const change=e=>setForm(p=>({...p,[e.target.name]:e.target.value}));
  const submit=e=>{e.preventDefault();if(!form.title.trim()||Number(form.amount)<=0)return;const {_id,userId,createdAt,updatedAt,...clean}=form;onSave({...clean,amount:Number(clean.amount)})};
  return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><div className="modal-header"><div><h3>{transaction?"Edit transaction":"Add transaction"}</h3><p>Saved directly to MongoDB.</p></div><button type="button" className="icon-btn" onClick={onClose}><X size={19}/></button></div>
    <label>Title<input name="title" value={form.title} onChange={change} placeholder="e.g. Grocery shopping" required/></label>
    <div className="form-row"><label>Amount<input name="amount" type="number" min="0.01" value={form.amount} onChange={change} required/></label><label>Type<select name="type" value={form.type} onChange={change}><option value="expense">Expense</option><option value="income">Income</option></select></label></div>
    <div className="form-row"><label>Category<select name="category" value={form.category} onChange={change}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Date<input name="date" type="date" value={form.date} onChange={change} required/></label></div>
    <label>Note<textarea name="note" value={form.note} onChange={change} rows="3" placeholder="Optional note..."/></label><div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn">{transaction?"Save changes":"Add transaction"}</button></div></form></div>;
}

function Budgets({data,add,remove}) {
  const [category,setCategory]=useState("Food");const [limit,setLimit]=useState("");
  const submit=async e=>{e.preventDefault();if(!limit)return;await add("budgets",{category,limit:Number(limit)});setLimit("");};
  const spent=c=>data.transactions.filter(t=>t.type==="expense"&&t.category===c).reduce((s,t)=>s+Number(t.amount),0);
  return <><div className="page-top"><div><h2>Budgets</h2><p>Your limits are now stored in the backend.</p></div></div><section className="panel"><h3>Create budget</h3><form className="inline-form" onSubmit={submit}><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.filter(c=>!["Salary","Freelance"].includes(c)).map(c=><option key={c}>{c}</option>)}</select><input type="number" min="1" value={limit} onChange={e=>setLimit(e.target.value)} placeholder="Monthly limit"/><button className="primary-btn"><Plus size={17}/> Add budget</button></form></section><div className="budget-grid">{data.budgets.map(b=>{const value=spent(b.category);const pct=Math.min(100,value/b.limit*100);return <div className="budget-card" key={b._id}><div className="budget-title"><div><strong>{b.category}</strong><span>{money(value)} of {money(b.limit)}</span></div><button onClick={()=>remove("budgets",b._id)}><Trash2 size={16}/></button></div><div className="progress"><span style={{width:`${pct}%`}}/></div><div className="budget-foot"><span>{pct.toFixed(0)}% used</span><span>{money(Math.max(0,b.limit-value))} left</span></div></div>})}</div></>;
}

function Loans({data,add,remove}) {
  const [form,setForm]=useState({name:"",principal:"",annualRate:"",months:""});
  const submit=async e=>{e.preventDefault();if(!form.name||!form.principal||!form.months)return;await add("loans",{...form,principal:Number(form.principal),annualRate:Number(form.annualRate),months:Number(form.months)});setForm({name:"",principal:"",annualRate:"",months:""});};
  return <><div className="page-top"><div><h2>Loans & EMI</h2><p>Calculate the monthly payment from your stored loan data.</p></div></div><section className="panel"><h3>Add loan</h3><form className="form-grid" onSubmit={submit}><label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Education loan"/></label><label>Principal<input type="number" value={form.principal} onChange={e=>setForm({...form,principal:e.target.value})}/></label><label>Annual interest %<input type="number" step=".01" value={form.annualRate} onChange={e=>setForm({...form,annualRate:e.target.value})}/></label><label>Duration (months)<input type="number" value={form.months} onChange={e=>setForm({...form,months:e.target.value})}/></label><button className="primary-btn form-submit"><Plus size={17}/> Add loan</button></form></section><div className="loan-grid">{data.loans.map(l=>{const emi=calculateEMI(l.principal,l.annualRate,l.months);const interest=emi*l.months-l.principal;return <div className="loan-card" key={l._id}><div className="loan-header"><div className="loan-icon"><CreditCard size={20}/></div><button onClick={()=>remove("loans",l._id)}><Trash2 size={16}/></button></div><h3>{l.name}</h3><div className="emi-value">{money(emi)}<small>/month</small></div><div className="loan-details"><span>Principal <b>{money(l.principal)}</b></span><span>Interest <b>{l.annualRate}%</b></span><span>Duration <b>{l.months} months</b></span><span>Total interest <b>{money(interest)}</b></span></div></div>})}</div></>;
}

function Investments({data,totals,add,remove}) {
  const [form,setForm]=useState({name:"",invested:"",current:"",type:"Mutual Fund"});
  const invested=data.investments.reduce((s,i)=>s+Number(i.invested),0);const current=data.investments.reduce((s,i)=>s+Number(i.current),0);const profit=current-invested;
  const submit=async e=>{e.preventDefault();if(!form.name||!form.invested||!form.current)return;await add("investments",{...form,invested:Number(form.invested),current:Number(form.current)});setForm({name:"",invested:"",current:"",type:"Mutual Fund"});};
  return <><div className="page-top"><div><h2>Investments</h2><p>Your portfolio is empty until you add your own holdings.</p></div></div><div className="stats-grid three"><StatCard icon={DollarSign} label="Invested" value={money(invested)} trend="Total capital"/><StatCard icon={TrendingUp} label="Current value" value={money(current)} trend="Portfolio value" positive/><StatCard icon={BarChart3} label="Returns" value={money(profit)} trend={`${invested?((profit/invested)*100).toFixed(2):0}% return`} positive={profit>=0} negative={profit<0}/></div><section className="panel"><h3>Add investment</h3><form className="form-grid" onSubmit={submit}><label>Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Index fund"/></label><label>Type<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option>Mutual Fund</option><option>Stocks</option><option>FD</option><option>Other</option></select></label><label>Invested<input type="number" value={form.invested} onChange={e=>setForm({...form,invested:e.target.value})}/></label><label>Current value<input type="number" value={form.current} onChange={e=>setForm({...form,current:e.target.value})}/></label><button className="primary-btn form-submit"><Plus size={17}/> Add investment</button></form></section><div className="investment-grid">{data.investments.map(i=>{const change=Number(i.current)-Number(i.invested);const pct=i.invested?change/i.invested*100:0;return <div className="investment-card" key={i._id}><div className="investment-top"><div className="investment-icon"><TrendingUp size={20}/></div><button onClick={()=>remove("investments",i._id)}><Trash2 size={16}/></button></div><span className="category">{i.type}</span><h3>{i.name}</h3><div className="investment-values"><div><small>Invested</small><b>{money(i.invested)}</b></div><div><small>Current</small><b>{money(i.current)}</b></div></div><div className={change>=0?"return positive":"return negative"}>{change>=0?"+":""}{money(change)} ({pct.toFixed(2)}%)</div></div>})}</div></>;
}

function Reports({data,totals}) {
  const categoriesData=useMemo(()=>{const map={};data.transactions.filter(t=>t.type==="expense").forEach(t=>map[t.category]=(map[t.category]||0)+Number(t.amount));return Object.entries(map).map(([category,amount])=>({category,amount}));},[data.transactions]);
  return <><div className="page-top"><div><h2>Financial report</h2><p>Summary generated from your backend records.</p></div><div className="report-badge"><FileText size={17}/> Live data</div></div><section className="panel report-summary"><div><span>Income</span><strong>{money(totals.income)}</strong></div><div><span>Expenses</span><strong>{money(totals.expenses)}</strong></div><div><span>Net savings</span><strong>{money(totals.balance)}</strong></div><div><span>Transactions</span><strong>{data.transactions.length}</strong></div></section><section className="panel"><div className="panel-heading"><div><h3>Expense breakdown</h3><span>By category</span></div></div><div className="chart-box report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoriesData} layout="vertical" margin={{left:20,right:20}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" tickFormatter={v=>`₹${v}`}/><YAxis dataKey="category" type="category" width={90}/><Tooltip formatter={v=>money(v)}/><Bar dataKey="amount" radius={[0,5,5,0]}/></BarChart></ResponsiveContainer></div></section></>;
}

function SettingsPage({dark,setDark,logout}) {
  return <><div className="page-top"><div><h2>Settings</h2><p>Account and interface settings.</p></div></div><section className="panel settings-panel"><div className="setting-row"><div><strong>Dark mode</strong><span>Use a darker interface.</span></div><button className={dark?"toggle on":"toggle"} onClick={()=>setDark(!dark)}><span/></button></div><div className="setting-row danger-row"><div><strong>Log out</strong><span>Remove the current login session from this browser.</span></div><button className="danger-btn" onClick={logout}>Log out</button></div></section></>;
}

function EmptyState({text}) { return <div className="empty">{text}</div>; }

export default App;
