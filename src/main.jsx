import React, { useMemo, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ChevronDown, Download, Info, LockKeyhole, Share2, ShieldCheck, WalletCards, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import './styles.scss';
import APP_PROPRETIES from './data/app.properties.json';
import BANK_DATA from './data/banks/banks.json'

const TITLES = APP_PROPRETIES.TITLES;
const SELECTED_TITLE = TITLES[Math.floor(Math.random() * TITLES.length)];
const BANKS = Object.values(BANK_DATA)
const QUICK_BANK_IDS = ['bdo', 'bpi', 'metrobank', 'gcash'];

const QR_IMAGES = import.meta.glob(
  "./data/banks/*.{png,jpg,jpeg,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

function BankLogo({ bank }) {
  return <div className={`bank-logo logo-${bank.tone}`}>{bank.short}</div>;
}

function BankPicker({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const bank = BANKS.find((item) => item.id === selected);

  return (
    <div className="picker-wrap">
      <button className="select-button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="select-bank">
          <BankLogo bank={bank} />
          <span>{bank.name}</span>
        </span>
        <ChevronDown size={22} className={open ? 'chevron rotate' : 'chevron'} />
      </button>
      {open && (
        <div className="dropdown" role="listbox">
          {BANKS.map((item) => (
            <button
              key={item.id}
              className={`dropdown-item ${item.id === selected ? 'selected' : ''}`}
              onClick={() => { onChange(item.id); setOpen(false); }}
            >
              <BankLogo bank={item} />
              <span>
                <strong>{item.name}</strong>
                <small>{item.accountNumber}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


const getBankFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const bankFromQuery = params.get("bank");

  if (bankFromQuery) {
    return bankFromQuery;
  }

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return window.location.pathname
    .replace(`${basePath}/`, "")
    .split("/")
    .filter(Boolean)[0];
};

document.title = document.title.replace("{{title}}", SELECTED_TITLE);

function App() {
  const pathBankId = getBankFromURL();
  const [selectedId, setSelectedId] = useState(pathBankId ? pathBankId : BANKS[0].id);
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedBank = useMemo(
    () => BANKS.find((bank) => bank.id === selectedId) ?? BANKS[0],
    [selectedId]
  );

  const copyQrImage = async () => {
      try {
        const imageUrl = getQRImage(selectedBank.qr);

        if (!imageUrl) {
          throw new Error("QR image not found");
        }

        const response = await fetch(imageUrl);
        const blob = await response.blob();

        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);

      } catch (error) {
        console.error("Failed to copy QR:", error);
      }
  };

  const saveQr = () => {
    const imageUrl = getQRImage(selectedBank.qr);

    if (!imageUrl) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${selectedBank.name}-JONAL-QRPH.png`;
    link.click();
  };

  const quickBanks = showAll ? BANKS : BANKS.slice(0, 4);
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "system"
  );

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

    const params = new URLSearchParams(window.location.search);
    const bank = params.get("bank");

    if (bank) {
      window.history.replaceState(
        {},
        "",
        `${basePath}/${bank}`
      );
    }
  }, []);

  const getQRImage = (filename) => {
    const path = Object.keys(QR_IMAGES).find(
      (key) => key.endsWith(`/${filename}`)
    );

    return path ? QR_IMAGES[path] : null;
  };

  const setSelectedBank = (bankId) => {
    setSelectedId(bankId);

    const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
    window.history.pushState({}, "", `${basePath}/${bankId}`);
  }

  return (
    <div className="app-shell">
      <main className="card">
        <header className="header">
          <div className="theme-toggle">
            <button
              className={theme === "light" ? "active" : ""}
              onClick={() => setTheme("light")}
              aria-label="Light theme"
            >
              ☀️
            </button>

            <button
              className={theme === "dark" ? "active" : ""}
              onClick={() => setTheme("dark")}
              aria-label="Dark theme"
            >
              🌙
            </button>

            <button
              className={theme === "system" ? "active" : ""}
              onClick={() => setTheme("system")}
              aria-label="System theme"
            >
              💻
            </button>
          </div>
          <div className="heading">
            <h1> {SELECTED_TITLE} </h1>
            <p>Need to send money to <b> Jonal or Primrose </b>? Pick a bank below and scan my QRPH code.</p>
          </div>
        </header>

        <section className="section">
          <div className="section-title">Select a bank you want to send the money to</div>
          <BankPicker selected={selectedId} onChange={setSelectedBank} />
        </section>

        <section className="quick-grid" aria-label="Popular banks">
          {quickBanks.map((bank) => (
            <button
              className={`quick-bank ${bank.id === selectedId ? 'active' : ''}`}
              key={bank.id}
              onClick={() => setSelectedBank(bank.id)}
            >
              <BankLogo bank={bank} />
              <span>{bank.name}</span>
            </button>
          ))}
          {!showAll && (
            <button className="quick-bank view-all" onClick={() => setShowAll(true)}>
              <span className="all-icon"><WalletCards size={25} /></span>
              <span>View all banks</span>
            </button>
          )}
        </section>

        {showAll && (
          <div className="view-all-row">
            <button className="text-button" onClick={() => setShowAll(false)}>Show fewer banks</button>
          </div>
        )}

        <section className="qr-panel">
          <div className="account-name">{selectedBank.accountName}</div>
          <div className="account-meta">{selectedBank.name} &nbsp;•&nbsp; {selectedBank.accountNumber}</div>
          <div className="account-type">Savings Account</div>
          <div className="qr-frame">
            <div className="qr-code-wrap">
              <img id="qr-code-image" src={getQRImage(selectedBank.qr)}/>
            </div>
          </div>
        </section>

        <section className="notice">
          <div className="shield"><ShieldCheck size={28} /></div>
          <div>
            <strong>Make sure to notify Jonal after sending money</strong>
            <p>Thank you for paying!</p>
          </div>
        </section>

        <section className="actions">
          <button className="secondary-action" onClick={copyQrImage}>
            <Share2 size={23} />
            <span>{copied ? 'Copied!' : 'Share QR'}</span>
          </button>
          <button className="primary-action" onClick={saveQr}>
            <Download size={23} />
            <span>Save QR</span>
          </button>
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
