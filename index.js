const express = require('express');
const app = express();
const PORT = 3000;
const fetch = require('node-fetch');

// Simple in-memory cache for ATFCF data
const atfcfCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

app.set('view engine', 'ejs');

async function getATFCF(ticker) {
  // Check cache first
  const cached = atfcfCache.get(ticker);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Cache hit for ${ticker}:`, cached.value);
    return cached.value;
  }
  
  const maxRetries = 2;
  const timeout = 5000; // Reduced from 10 seconds to 5 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const res = await fetch(`${window.API_BASE_URL}/atfcf?ticker=${ticker}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        if (attempt === maxRetries) {
          console.error(`HTTP error for ${ticker}: ${res.status}`);
        }
        continue; // Try again
      }
      
    const data = await res.json();
      
      if (data.error) {
        if (attempt === maxRetries) {
          console.error(`API error for ${ticker}:`, data.error);
        }
        continue; // Try again
      }
      
      const result = data.atfcf || null;
      
      // Cache the result
      atfcfCache.set(ticker, {
        value: result,
        timestamp: Date.now()
      });
      
      console.log(`ATFCF for ${ticker}:`, result);
      return result;
      
  } catch (err) {
      if (err.name === 'AbortError') {
        if (attempt === maxRetries) {
          console.error(`Timeout fetching ATFCF for ${ticker}`);
        }
      } else {
        if (attempt === maxRetries) {
          console.error(`Error fetching ATFCF for ${ticker}:`, err.message);
        }
      }
      
      if (attempt === maxRetries) {
    return null;
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return null;
}

async function getCompaniesWithATFCF(companies) {
  console.log(`Fetching ATFCF data for ${companies.length} companies...`);
  
  // Process companies in larger batches with shorter delays
  const batchSize = 20; // Increased from 10 to 20
  const companiesWithATFCF = [];
  
  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(companies.length/batchSize)} (${batch.length} companies)`);
    
    const batchResults = await Promise.all(batch.map(async company => {
    const atfcf = await getATFCF(company.ticker);
    return { ...company, atfcf };
  }));
    
    companiesWithATFCF.push(...batchResults);
    
    // Reduced delay between batches
    if (i + batchSize < companies.length) {
      await new Promise(resolve => setTimeout(resolve, 300)); // Reduced from 1000ms to 300ms
    }
  }
  
  const companiesWithData = companiesWithATFCF.filter(company => company.atfcf !== null);
  const companiesWithoutData = companiesWithATFCF.filter(company => company.atfcf === null);
  
  console.log(`Successfully fetched data for ${companiesWithData.length} companies`);
  console.log(`No data available for ${companiesWithoutData.length} companies`);
  
  // Return all companies, but mark those without data
  return companiesWithATFCF;
}

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ATFCF Financial Tool</title>
      <style>
        body {
          background: #000;
          color: #fff;
          font-family: 'Segoe UI', Arial, sans-serif;
          margin: 0;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .nav {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 2rem 3rem 0 3rem;
          box-sizing: border-box;
        }
        .nav a {
          color: #fff;
          text-decoration: none;
          margin-left: 2rem;
          font-size: 1.1rem;
          font-weight: 400;
          transition: color 0.2s;
        }
        .nav a.active, .nav a:hover {
          color: #22c55e;
          font-weight: 500;
        }
        .logo {
          color: #22c55e;
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: 2px;
          margin-right: auto;
        }
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          max-width: 700px;
          margin: 0 auto;
          padding: 4rem 2rem 0 2rem;
        }
        .main h1 {
          font-size: 3rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
        }
        .main h1 .green {
          color: #22c55e;
        }
        .main .desc {
          font-size: 1.25rem;
          color: #e0e0e0;
          margin-bottom: 2.5rem;
          max-width: 600px;
        }
        .main .cta {
          background: #22c55e;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.9em 2.2em;
          font-size: 1.1rem;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 2px 8px #22c55e33;
          transition: background 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        .main .cta:hover {
          background: #15803d;
        }
        
        /* Formula Box Styles */
        .formula-box {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 2px solid #22c55e;
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 8px 32px rgba(34, 197, 94, 0.1);
        }
        
        .formula-box h2 {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
          text-align: center;
          color: #fff;
        }
        
        .formula {
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
          padding: 1.5rem;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        
        /* Components Section */
        .components h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.3rem;
          color: #22c55e;
        }
        
        .component-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .component {
          background: linear-gradient(135deg, #1f1f1f 0%, #2f2f2f 100%);
          border: 1px solid #333;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }
        
        .component:hover {
          border-color: #22c55e;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(34, 197, 94, 0.15);
        }
        
        .component .label {
          display: block;
          font-size: 1.2rem;
          font-weight: 700;
          color: #22c55e;
          margin-bottom: 0.5rem;
        }
        
        .component .definition {
          display: block;
          color: #ccc;
          line-height: 1.4;
        }
        
        /* Explanation Section */
        .explanation {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 1px solid #333;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .explanation h3 {
          margin: 0 0 1rem 0;
          font-size: 1.3rem;
          color: #22c55e;
        }
        
        .explanation p {
          margin: 0;
          color: #ccc;
          line-height: 1.6;
        }
        
        .mountains {
          width: 100vw;
          min-width: 100%;
          margin-top: auto;
          display: block;
        }
        @media (max-width: 700px) {
          .main h1 { font-size: 2rem; }
          .main { padding-top: 2rem; }
          .nav { padding: 1.2rem 1rem 0 1rem; }
        }
      </style>
    </head>
    <body>
      <div class="nav">
        <span class="logo">ATFCF</span>
        <a href="/" class="active">Home</a>
        <a href="/calc">How to Calculate ATFCF</a>
        <a href="/sp500">S&amp;P 500 Companies</a>
      </div>
      <div class="main">
        <h1>Welcome <span class="green"></span></h1>
        <div class="desc">After-tax free cash flow (ATFCF) represents the cash a company generates after accounting for all expenses, including taxes, and after making necessary investments to maintain its operations. It is a crucial metric for assessing a company's financial health and its ability to generate cash for shareholders, creditors, or reinvestment.</div>
        <a class="cta" href="/sp500">Get Started</a>
      </div>
      <svg class="mountains" height="180" viewBox="0 0 1440 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon fill="#22c55e" fill-opacity="0.7" points="0,180 300,100 600,160 900,80 1200,140 1440,100 1440,180"/>
        <polygon fill="#22c55e" fill-opacity="0.5" points="0,180 200,120 500,170 800,90 1100,150 1440,120 1440,180"/>
        <polygon fill="#22c55e" fill-opacity="0.3" points="0,180 100,140 400,180 700,120 1000,170 1440,140 1440,180"/>
      </svg>
    </body>
    </html>
  `);
});

app.get('/calc', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ATFCF Financial Tool</title>
      <style>
        body {
          background: #000;
          color: #fff;
          font-family: 'Segoe UI', Arial, sans-serif;
          margin: 0;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .nav {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 2rem 3rem 0 3rem;
          box-sizing: border-box;
        }
        .nav a {
          color: #fff;
          text-decoration: none;
          margin-left: 2rem;
          font-size: 1.1rem;
          font-weight: 400;
          transition: color 0.2s;
        }
        .nav a.active, .nav a:hover {
          color: #22c55e;
          font-weight: 500;
        }
        .logo {
          color: #22c55e;
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: 2px;
          margin-right: auto;
        }
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          max-width: 700px;
          margin: 0 auto;
          padding: 4rem 2rem 0 2rem;
        }
        .main h1 {
          font-size: 3rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
        }
        .main h1 .green {
          color: #22c55e;
        }
        .main .desc {
          font-size: 1.25rem;
          color: #e0e0e0;
          margin-bottom: 2.5rem;
          max-width: 600px;
        }
        .main .cta {
          background: #22c55e;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.9em 2.2em;
          font-size: 1.1rem;
          font-weight: 500;
          cursor: pointer;
          box-shadow: 0 2px 8px #22c55e33;
          transition: background 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        .main .cta:hover {
          background: #15803d;
        }
        .mountains {
          width: 100vw;
          min-width: 100%;
          margin-top: auto;
          display: block;
        }
        @media (max-width: 700px) {
          .main h1 { font-size: 2rem; }
          .main { padding-top: 2rem; }
          .nav { padding: 1.2rem 1rem 0 1rem; }
        }
      </style>
    </head>
    <body>
      <div class="nav">
        <span class="logo">ATFCF</span>
        <a href="/">Home</a>
        <a href="/calc" class="active">How to Calculate ATFCF</a>
        <a href="/sp500">S&amp;P 500 Companies</a>
      </div>
      <div class="main">
        <h1><span class="green">How to Calculate ATFCF</span></h1>
        <div class="desc">
          <div class="formula-box">
            <h2>The <span class="green">ATFCF</span> Formula</h2>
            <div class="formula">
              <span class="green">ATFCF</span> = <span class="green">FCF</span> - (<span class="green">EBIT</span> × <span class="green">Tax Rate</span>)
            </div>
          </div>
          
          <div class="components">
            <h3>Where:</h3>
            <div class="component-grid">
              <div class="component">
                <span class="label">FCF</span>
                <span class="definition"> = Free Cash Flow (TTM)</span>
              </div>
              <div class="component">
                <span class="label">EBIT</span>
                <span class="definition"> = Earnings Before Interest and Taxes (TTM)</span>
              </div>
              <div class="component">
                <span class="label">Tax Rate</span>
                <span class="definition"> = Effective Corporate Tax Rate</span>
              </div>
            </div>
          </div>
          
          <div class="explanation">
            <h3>Why This Formula?</h3>
            <p>This simplified approach directly adjusts Free Cash Flow by removing the tax burden on EBIT, giving you a clearer picture of after-tax cash generation potential.</p>
          </div>
        </div>

      <svg class="mountains" height="180" viewBox="0 0 1440 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon fill="#22c55e" fill-opacity="0.7" points="0,180 300,100 600,160 900,80 1200,140 1440,100 1440,180"/>
        <polygon fill="#22c55e" fill-opacity="0.5" points="0,180 200,120 500,170 800,90 1100,150 1440,120 1440,180"/>
        <polygon fill="#22c55e" fill-opacity="0.3" points="0,180 100,140 400,180 700,120 1000,170 1440,140 1440,180"/>
      </svg>
    </body>
    </html>
  `);
});


app.get('/sp500', async (req, res) => {
  const companies = [
    { name: '3M', ticker: 'MMM' },
    { name: 'A. O. Smith', ticker: 'AOS' },
    { name: 'Abbott Laboratories', ticker: 'ABT' },
    { name: 'AbbVie', ticker: 'ABBV' },
    { name: 'Accenture', ticker: 'ACN' },
    { name: 'Adobe Inc.', ticker: 'ADBE' },
    { name: 'Advanced Micro Devices', ticker: 'AMD' },
    { name: 'AES Corporation', ticker: 'AES' },
    { name: 'Aflac', ticker: 'AFL' },
    { name: 'Agilent Technologies', ticker: 'A' },
    { name: 'Air Products and Chemicals', ticker: 'APD' },
    { name: 'Akamai Technologies', ticker: 'AKAM' },
    { name: 'Alaska Air Group', ticker: 'ALK' },
    { name: 'Albemarle Corporation', ticker: 'ALB' },
    { name: 'Alexandria Real Estate Equities', ticker: 'ARE' },
    { name: 'Align Technology', ticker: 'ALGN' },
    { name: 'Allegion', ticker: 'ALLE' },
    { name: 'Alliant Energy', ticker: 'LNT' },
    { name: 'Allstate', ticker: 'ALL' },
    { name: 'Alphabet Inc. (Class A)', ticker: 'GOOGL' },
    { name: 'Alphabet Inc. (Class C)', ticker: 'GOOG' },
    { name: 'Altria Group', ticker: 'MO' },
    { name: 'Amazon', ticker: 'AMZN' },
    { name: 'Ameren', ticker: 'AEE' },
    { name: 'American Airlines Group', ticker: 'AAL' },
    { name: 'American Electric Power', ticker: 'AEP' },
    { name: 'American Express', ticker: 'AXP' },
    { name: 'American International Group', ticker: 'AIG' },
    { name: 'American Tower', ticker: 'AMT' },
    { name: 'American Water Works', ticker: 'AWK' },
    { name: 'Ameriprise Financial', ticker: 'AMP' },
    { name: 'AmerisourceBergen', ticker: 'ABC' },
    { name: 'Amgen', ticker: 'AMGN' },
    { name: 'Amphenol', ticker: 'APH' },
    { name: 'Analog Devices', ticker: 'ADI' },
    { name: 'ANSYS', ticker: 'ANSS' },
    { name: 'Anthem', ticker: 'ANTM' },
    { name: 'Aon', ticker: 'AON' },
    { name: 'APA Corporation', ticker: 'APA' },
    { name: 'Apple Inc.', ticker: 'AAPL' },
    { name: 'Applied Materials', ticker: 'AMAT' },
    { name: 'Aptiv', ticker: 'APTV' },
    { name: 'Arch Capital Group', ticker: 'ACGL' },
    { name: 'Archer-Daniels-Midland', ticker: 'ADM' },
    { name: 'Arista Networks', ticker: 'ANET' },
    { name: 'Arthur J. Gallagher & Co.', ticker: 'AJG' },
    { name: 'Assurant', ticker: 'AIZ' },
    { name: 'AT&T', ticker: 'T' },
    { name: 'Atmos Energy', ticker: 'ATO' },
    { name: 'Autodesk', ticker: 'ADSK' },
    { name: 'Automatic Data Processing', ticker: 'ADP' },
    { name: 'AutoZone', ticker: 'AZO' },
    { name: 'AvalonBay Communities', ticker: 'AVB' },
    { name: 'Baker Hughes', ticker: 'BKR' },
    { name: 'Ball Corporation', ticker: 'BLL' },
    { name: 'Bank of America', ticker: 'BAC' },
    { name: 'Bath & Body Works', ticker: 'BBWI' },
    { name: 'Baxter International', ticker: 'BAX' },
    { name: 'Becton Dickinson', ticker: 'BDX' },
    { name: 'Berkshire Hathaway (Class A)', ticker: 'BRK.A' },
    { name: 'Berkshire Hathaway (Class B)', ticker: 'BRK.B' },
    { name: 'Best Buy', ticker: 'BBY' },
    { name: 'Biogen', ticker: 'BIIB' },
    { name: 'BlackRock', ticker: 'BLK' },
    { name: 'Boeing', ticker: 'BA' },
    { name: 'Booking Holdings', ticker: 'BKNG' },
    { name: 'BorgWarner', ticker: 'BWA' },
    { name: 'Boston Properties', ticker: 'BXP' },
    { name: 'Boston Scientific', ticker: 'BSX' },
    { name: 'Bristol-Myers Squibb', ticker: 'BMY' },
    { name: 'Broadcom Inc.', ticker: 'AVGO' },
    { name: 'Broadridge Financial Solutions', ticker: 'BR' },
    { name: 'Brown & Brown', ticker: 'BRO' },
    { name: 'C. H. Robinson', ticker: 'CHRW' },
    { name: 'Cadence Design Systems', ticker: 'CDNS' },
    { name: 'Caesars Entertainment', ticker: 'CZR' },
    { name: 'Campbell Soup Company', ticker: 'CPB' },
    { name: 'Capital One', ticker: 'COF' },
    { name: 'Cardinal Health', ticker: 'CAH' },
    { name: 'CarMax', ticker: 'KMX' },
    { name: 'Carnival Corporation', ticker: 'CCL' },
    { name: 'Carrier Global', ticker: 'CARR' },
    { name: 'Catalent', ticker: 'CTLT' },
    { name: 'Caterpillar Inc.', ticker: 'CAT' },
    { name: 'CBRE Group', ticker: 'CBRE' },
    { name: 'CDW', ticker: 'CDW' },
    { name: 'Centene Corporation', ticker: 'CNC' },
    { name: 'CenterPoint Energy', ticker: 'CNP' },
    { name: 'Ceridian', ticker: 'CDAY' },
    { name: 'CF Industries', ticker: 'CF' },
    { name: 'Charles Schwab Corporation', ticker: 'SCHW' },
    { name: 'Charter Communications', ticker: 'CHTR' },
    { name: 'Chevron Corporation', ticker: 'CVX' },
    { name: 'Chipotle Mexican Grill', ticker: 'CMG' },
    { name: 'Chubb Limited', ticker: 'CB' },
    { name: 'Church & Dwight', ticker: 'CHD' },
    { name: 'Cigna', ticker: 'CI' },
    { name: 'Cincinnati Financial', ticker: 'CINF' },
    { name: 'Cisco Systems', ticker: 'CSCO' },
    { name: 'Citigroup', ticker: 'C' },
    { name: 'Citizens Financial Group', ticker: 'CFG' },
    { name: 'Citrix Systems', ticker: 'CTXS' },
    { name: 'Clorox', ticker: 'CLX' },
    { name: 'CME Group', ticker: 'CME' },
    { name: 'CMS Energy', ticker: 'CMS' },
    { name: 'Coca-Cola Company', ticker: 'KO' },
    { name: 'Cognizant', ticker: 'CTSH' },
    { name: 'Colgate-Palmolive', ticker: 'CL' },
    { name: 'Comcast', ticker: 'CMCSA' },
    { name: 'Comerica', ticker: 'CMA' },
    { name: 'ConAgra Brands', ticker: 'CAG' },
    { name: 'ConocoPhillips', ticker: 'COP' },
    { name: 'Consolidated Edison', ticker: 'ED' },
    { name: 'Constellation Brands', ticker: 'STZ' },
    { name: 'CooperCompanies', ticker: 'COO' },
    { name: 'Copart', ticker: 'CPRT' },
    { name: 'Corning Inc.', ticker: 'GLW' },
    { name: 'Costco', ticker: 'COST' },
    { name: 'Coterra Energy', ticker: 'CTRA' },
    { name: 'Crown Castle', ticker: 'CCI' },
    { name: 'CSX Corporation', ticker: 'CSX' },
    { name: 'Cummins', ticker: 'CMI' },
    { name: 'CVS Health', ticker: 'CVS' },
    { name: 'D. R. Horton', ticker: 'DHI' },
    { name: 'Danaher Corporation', ticker: 'DHR' },
    { name: 'Darden Restaurants', ticker: 'DRI' },
    { name: 'DaVita Inc.', ticker: 'DVA' },
    { name: 'Deere & Company', ticker: 'DE' },
    { name: 'Delta Air Lines', ticker: 'DAL' },
    { name: 'Dentsply Sirona', ticker: 'XRAY' },
    { name: 'Devon Energy', ticker: 'DVN' },
    { name: 'Diamondback Energy', ticker: 'FANG' },
    { name: 'Digital Realty Trust', ticker: 'DLR' },
    { name: 'Discover Financial', ticker: 'DFS' },
    { name: 'Dollar General', ticker: 'DG' },
    { name: 'Dollar Tree', ticker: 'DLTR' },
    { name: 'Dominion Energy', ticker: 'D' },
    { name: 'Dover Corporation', ticker: 'DOV' },
    { name: 'Dow Inc.', ticker: 'DOW' },
    { name: 'DTE Energy', ticker: 'DTE' },
    { name: 'Duke Energy', ticker: 'DUK' },
    { name: 'DuPont de Nemours', ticker: 'DD' },
    { name: 'Duke Realty', ticker: 'DRE' },
    { name: 'Eaton Corporation', ticker: 'ETN' },
    { name: 'eBay', ticker: 'EBAY' },
    { name: 'Ecolab', ticker: 'ECL' },
    { name: 'Edison International', ticker: 'EIX' },
    { name: 'Edwards Lifesciences', ticker: 'EW' },
    { name: 'Electronic Arts', ticker: 'EA' },
    { name: 'Elevance Health', ticker: 'ELV' },
    { name: 'Emerson Electric', ticker: 'EMR' },
    { name: 'Enphase Energy', ticker: 'ENPH' },
    { name: 'Entergy', ticker: 'ETR' },
    { name: 'EOG Resources', ticker: 'EOG' },
    { name: 'EPAM Systems', ticker: 'EPAM' },
    { name: 'EQR', ticker: 'EQR' },
    { name: 'Equifax', ticker: 'EFX' },
    { name: 'Equinix', ticker: 'EQIX' },
    { name: 'Essex Property Trust', ticker: 'ESS' },
    { name: 'Estée Lauder Companies', ticker: 'EL' },
    { name: 'Eversource Energy', ticker: 'ES' },
    { name: 'Exelon', ticker: 'EXC' },
    { name: 'Expedia Group', ticker: 'EXPE' },
    { name: 'Expeditors International', ticker: 'EXPD' },
    { name: 'Extra Space Storage', ticker: 'EXR' },
    { name: 'ExxonMobil', ticker: 'XOM' },
    { name: 'F5 Networks', ticker: 'FFIV' },
    { name: 'FactSet', ticker: 'FDS' },
    { name: 'Fastenal', ticker: 'FAST' },
    { name: 'Federal Realty Investment Trust', ticker: 'FRT' },
    { name: 'FedEx', ticker: 'FDX' },
    { name: 'Fidelity National Information Services', ticker: 'FIS' },
    { name: 'Fifth Third Bancorp', ticker: 'FITB' },
    { name: 'First Republic Bank', ticker: 'FRC' },
    { name: 'FirstEnergy', ticker: 'FE' },
    { name: 'Fiserv', ticker: 'FISV' },
    { name: 'FleetCor', ticker: 'FLT' },
    { name: 'Ford Motor Company', ticker: 'F' },
    { name: 'Fortinet', ticker: 'FTNT' },
    { name: 'Fortune Brands Home & Security', ticker: 'FBHS' },
    { name: 'Fox Corporation (Class A)', ticker: 'FOXA' },
    { name: 'Fox Corporation (Class B)', ticker: 'FOX' },
    { name: 'Franklin Resources', ticker: 'BEN' },
    { name: 'Freeport-McMoRan', ticker: 'FCX' },
    { name: 'Gap Inc.', ticker: 'GPS' },
    { name: 'Garmin', ticker: 'GRMN' },
    { name: 'Gartner', ticker: 'IT' },
    { name: 'General Dynamics', ticker: 'GD' },
    { name: 'General Electric', ticker: 'GE' },
    { name: 'General Mills', ticker: 'GIS' },
    { name: 'General Motors', ticker: 'GM' },
    { name: 'Gilead Sciences', ticker: 'GILD' },
    { name: 'Global Payments', ticker: 'GPN' },
    { name: 'Goldman Sachs', ticker: 'GS' },
    { name: 'Halliburton', ticker: 'HAL' },
    { name: 'Harley-Davidson', ticker: 'HOG' },
    { name: 'Harris Corporation', ticker: 'HRS' },
    { name: 'Hartford Financial Services', ticker: 'HIG' },
    { name: 'Hasbro', ticker: 'HAS' },
    { name: 'HCA Healthcare', ticker: 'HCA' },
    { name: 'Henry Schein', ticker: 'HSIC' },
    { name: 'Hess Corporation', ticker: 'HES' },
    { name: 'Hewlett Packard Enterprise', ticker: 'HPE' },
    { name: 'Home Depot', ticker: 'HD' },
    { name: 'Honeywell', ticker: 'HON' },
    { name: 'Hormel Foods', ticker: 'HRL' },
    { name: 'Host Hotels & Resorts', ticker: 'HST' },
    { name: 'Howmet Aerospace', ticker: 'HWM' },
    { name: 'HP Inc.', ticker: 'HPQ' },
    { name: 'Humana', ticker: 'HUM' },
    { name: 'Huntington Bancshares', ticker: 'HBAN' },
    { name: 'Huntington Ingalls Industries', ticker: 'HII' },
    { name: 'IDEXX Laboratories', ticker: 'IDXX' },
    { name: 'IDEX Corporation', ticker: 'IEX' },
    { name: 'Illinois Tool Works', ticker: 'ITW' },
    { name: 'Incyte', ticker: 'INCY' },
    { name: 'Intel', ticker: 'INTC' },
    { name: 'Intercontinental Exchange', ticker: 'ICE' },
    { name: 'International Business Machines', ticker: 'IBM' },
    { name: 'International Paper', ticker: 'IP' },
    { name: 'Interpublic Group', ticker: 'IPG' },
    { name: 'Intuit', ticker: 'INTU' },
    { name: 'Intuitive Surgical', ticker: 'ISRG' },
    { name: 'IPG Photonics', ticker: 'IPGP' },
    { name: 'IQVIA', ticker: 'IQV' },
    { name: 'Iron Mountain', ticker: 'IRM' },
    { name: 'J. B. Hunt', ticker: 'JBHT' },
    { name: 'Jabil', ticker: 'JBL' },
    { name: 'Jack Henry & Associates', ticker: 'JKHY' },
    { name: 'Jacobs Engineering Group', ticker: 'J' },
    { name: 'Johnson & Johnson', ticker: 'JNJ' },
    { name: 'Johnson Controls', ticker: 'JCI' },
    { name: 'JPMorgan Chase', ticker: 'JPM' },
    { name: 'Juniper Networks', ticker: 'JNPR' },
    { name: 'Kellogg Company', ticker: 'K' },
    { name: 'KeyCorp', ticker: 'KEY' },
    { name: 'Keysight Technologies', ticker: 'KEYS' },
    { name: 'Kimberly-Clark', ticker: 'KMB' },
    { name: 'Kimco Realty', ticker: 'KIM' },
    { name: 'Kinder Morgan', ticker: 'KMI' },
    { name: 'KLA Corporation', ticker: 'KLAC' },
    { name: 'Kraft Heinz', ticker: 'KHC' },
    { name: 'Kroger', ticker: 'KR' },
    { name: 'L3Harris Technologies', ticker: 'LHX' },
    { name: 'Laboratory Corporation of America', ticker: 'LH' },
    { name: 'Lam Research', ticker: 'LRCX' },
    { name: 'Lamb Weston', ticker: 'LW' },
    { name: 'Las Vegas Sands', ticker: 'LVS' },
    { name: 'Leidos', ticker: 'LDOS' },
    { name: 'Lennar', ticker: 'LEN' },
    { name: 'Lincoln National', ticker: 'LNC' },
    { name: 'Linde plc', ticker: 'LIN' },
    { name: 'Live Nation Entertainment', ticker: 'LYV' },
    { name: 'LKQ Corporation', ticker: 'LKQ' },
    { name: 'Lockheed Martin', ticker: 'LMT' },
    { name: 'Loews Corporation', ticker: 'L' },
    { name: 'Lowe\'s', ticker: 'LOW' },
    { name: 'Lumen Technologies', ticker: 'LUMN' },
    { name: 'LyondellBasell', ticker: 'LYB' },
    { name: 'Marathon Oil', ticker: 'MRO' },
    { name: 'Marathon Petroleum', ticker: 'MPC' },
    { name: 'MarketAxess', ticker: 'MKTX' },
    { name: 'Marriott International', ticker: 'MAR' },
    { name: 'Marsh & McLennan', ticker: 'MMC' },
    { name: 'Martin Marietta Materials', ticker: 'MLM' },
    { name: 'Masco', ticker: 'MAS' },
    { name: 'Mastercard', ticker: 'MA' },
    { name: 'Match Group', ticker: 'MTCH' },
    { name: 'McCormick & Company', ticker: 'MKC' },
    { name: 'McDonald\'s', ticker: 'MCD' },
    { name: 'McKesson', ticker: 'MCK' },
    { name: 'Medtronic', ticker: 'MDT' },
    { name: 'Merck & Co.', ticker: 'MRK' },
    { name: 'Meta Platforms', ticker: 'META' },
    { name: 'MetLife', ticker: 'MET' },
    { name: 'MGM Resorts International', ticker: 'MGM' },
    { name: 'Microchip Technology', ticker: 'MCHP' },
    { name: 'Microsoft', ticker: 'MSFT' },
    { name: 'Mid-America Apartment Communities', ticker: 'MAA' },
    { name: 'Moderna', ticker: 'MRNA' },
    { name: 'Mohawk Industries', ticker: 'MHK' },
    { name: 'Molson Coors Beverage Company', ticker: 'TAP' },
    { name: 'Mondelez International', ticker: 'MDLZ' },
    { name: 'Monster Beverage', ticker: 'MNST' },
    { name: 'Moody\'s Corporation', ticker: 'MCO' },
    { name: 'Morgan Stanley', ticker: 'MS' },
    { name: 'Motorola Solutions', ticker: 'MSI' },
    { name: 'MSCI', ticker: 'MSCI' },
    { name: 'Nasdaq, Inc.', ticker: 'NDAQ' },
    { name: 'NetApp', ticker: 'NTAP' },
    { name: 'Netflix', ticker: 'NFLX' },
    { name: 'Newell Brands', ticker: 'NWL' },
    { name: 'Newmont Corporation', ticker: 'NEM' },
    { name: 'News Corp (Class A)', ticker: 'NWSA' },
    { name: 'News Corp (Class B)', ticker: 'NWS' },
    { name: 'NextEra Energy', ticker: 'NEE' },
    { name: 'Nike, Inc.', ticker: 'NKE' },
    { name: 'NiSource', ticker: 'NI' },
    { name: 'Norfolk Southern', ticker: 'NSC' },
    { name: 'Northern Trust', ticker: 'NTRS' },
    { name: 'Northrop Grumman', ticker: 'NOC' },
    { name: 'Norwegian Cruise Line', ticker: 'NCLH' },
    { name: 'NRG Energy', ticker: 'NRG' },
    { name: 'Nucor', ticker: 'NUE' },
    { name: 'Nvidia', ticker: 'NVDA' },
    { name: 'NVR, Inc.', ticker: 'NVR' },
    { name: 'O\'Reilly Automotive', ticker: 'ORLY' },
    { name: 'Occidental Petroleum', ticker: 'OXY' },
    { name: 'Old Dominion Freight Line', ticker: 'ODFL' },
    { name: 'Omnicom Group', ticker: 'OMC' },
    { name: 'ON Semiconductor', ticker: 'ON' },
    { name: 'Oneok', ticker: 'OKE' },
    { name: 'Oracle Corporation', ticker: 'ORCL' },
    { name: 'Otis Worldwide', ticker: 'OTIS' },
    { name: 'PACCAR', ticker: 'PCAR' },
    { name: 'Paramount Global', ticker: 'PARA' },
    { name: 'Paychex', ticker: 'PAYX' },
    { name: 'PayPal', ticker: 'PYPL' },
    { name: 'Pentair', ticker: 'PNR' },
    { name: 'PepsiCo', ticker: 'PEP' },
    { name: 'Pfizer', ticker: 'PFE' },
    { name: 'Philip Morris International', ticker: 'PM' },
    { name: 'Phillips 66', ticker: 'PSX' },
    { name: 'Pinnacle West Capital', ticker: 'PNW' },
    { name: 'Pioneer Natural Resources', ticker: 'PXD' },
    { name: 'PNC Financial Services', ticker: 'PNC' },
    { name: 'Pool Corporation', ticker: 'POOL' },
    { name: 'PPG Industries', ticker: 'PPG' },
    { name: 'PPL Corporation', ticker: 'PPL' },
    { name: 'Principal Financial Group', ticker: 'PFG' },
    { name: 'Procter & Gamble', ticker: 'PG' },
    { name: 'Progressive Corporation', ticker: 'PGR' },
    { name: 'Prologis', ticker: 'PLD' },
    { name: 'Prudential Financial', ticker: 'PRU' },
    { name: 'Public Storage', ticker: 'PSA' },
    { name: 'PulteGroup', ticker: 'PHM' },
    { name: 'PVH Corp.', ticker: 'PVH' },
    { name: 'Qorvo', ticker: 'QRVO' },
    { name: 'Quanta Services', ticker: 'PWR' },
    { name: 'Qualcomm', ticker: 'QCOM' },
    { name: 'Quest Diagnostics', ticker: 'DGX' },
    { name: 'Raytheon Technologies', ticker: 'RTX' },
    { name: 'Realty Income', ticker: 'O' },
    { name: 'Regeneron Pharmaceuticals', ticker: 'REGN' },
    { name: 'Regions Financial', ticker: 'RF' },
    { name: 'Republic Services', ticker: 'RSG' },
    { name: 'ResMed', ticker: 'RMD' },
    { name: 'Robert Half International', ticker: 'RHI' },
    { name: 'Rockwell Automation', ticker: 'ROK' },
    { name: 'Rollins', ticker: 'ROL' },
    { name: 'Roper Technologies', ticker: 'ROP' },
    { name: 'Ross Stores', ticker: 'ROST' },
    { name: 'Royal Caribbean Group', ticker: 'RCL' },
    { name: 'S&P Global', ticker: 'SPGI' },
    { name: 'Salesforce', ticker: 'CRM' },
    { name: 'SBA Communications', ticker: 'SBAC' },
    { name: 'Schlumberger', ticker: 'SLB' },
    { name: 'Seagate Technology', ticker: 'STX' },
    { name: 'Sempra Energy', ticker: 'SRE' },
    { name: 'ServiceNow', ticker: 'NOW' },
    { name: 'Sherwin-Williams', ticker: 'SHW' },
    { name: 'Signature Bank', ticker: 'SBNY' },
    { name: 'Simon Property Group', ticker: 'SPG' },
    { name: 'Skyworks Solutions', ticker: 'SWKS' },
    { name: 'Snap Inc.', ticker: 'SNAP' },
    { name: 'Southern Company', ticker: 'SO' },
    { name: 'Southwest Airlines', ticker: 'LUV' },
    { name: 'Stanley Black & Decker', ticker: 'SWK' },
    { name: 'Starbucks', ticker: 'SBUX' },
    { name: 'State Street Corporation', ticker: 'STT' },
    { name: 'Steris', ticker: 'STE' },
    { name: 'Stryker Corporation', ticker: 'SYK' },
    { name: 'Synopsys', ticker: 'SNPS' },
    { name: 'Sysco', ticker: 'SYY' },
    { name: 'T-Mobile US', ticker: 'TMUS' },
    { name: 'T. Rowe Price', ticker: 'TROW' },
    { name: 'Take-Two Interactive', ticker: 'TTWO' },
    { name: 'Target Corporation', ticker: 'TGT' },
    { name: 'TE Connectivity', ticker: 'TEL' },
    { name: 'Tesla, Inc.', ticker: 'TSLA' },
    { name: 'Texas Instruments', ticker: 'TXN' },
    { name: 'Textron', ticker: 'TXT' },
    { name: 'Thermo Fisher Scientific', ticker: 'TMO' },
    { name: 'TJX Companies', ticker: 'TJX' },
    { name: 'Tractor Supply Company', ticker: 'TSCO' },
    { name: 'Trane Technologies', ticker: 'TT' },
    { name: 'TransDigm Group', ticker: 'TDG' },
    { name: 'Travelers Companies', ticker: 'TRV' },
    { name: 'Truist Financial', ticker: 'TFC' },
    { name: 'Tyler Technologies', ticker: 'TYL' },
    { name: 'Tyson Foods', ticker: 'TSN' },
    { name: 'U.S. Bancorp', ticker: 'USB' },
    { name: 'Uber Technologies', ticker: 'UBER' },
    { name: 'Ulta Beauty', ticker: 'ULTA' },
    { name: 'Union Pacific', ticker: 'UNP' },
    { name: 'United Airlines Holdings', ticker: 'UAL' },
    { name: 'UnitedHealth Group', ticker: 'UNH' },
    { name: 'United Parcel Service', ticker: 'UPS' },
    { name: 'United Rentals', ticker: 'URI' },
    { name: 'United States Steel', ticker: 'X' },
    { name: 'Universal Health Services', ticker: 'UHS' },
    { name: 'Valero Energy', ticker: 'VLO' },
    { name: 'Ventas', ticker: 'VTR' },
    { name: 'Verisign', ticker: 'VRSN' },
    { name: 'Verizon Communications', ticker: 'VZ' },
    { name: 'Vertex Pharmaceuticals', ticker: 'VRTX' },
    { name: 'Visa Inc.', ticker: 'V' },
    { name: 'Vornado Realty Trust', ticker: 'VNO' },
    { name: 'Vulcan Materials', ticker: 'VMC' },
    { name: 'W. R. Berkley', ticker: 'WRB' },
    { name: 'Walgreens Boots Alliance', ticker: 'WBA' },
    { name: 'Walmart', ticker: 'WMT' },
    { name: 'Walt Disney Company', ticker: 'DIS' },
    { name: 'Waste Management', ticker: 'WM' },
    { name: 'Waters Corporation', ticker: 'WAT' },
    { name: 'WEC Energy Group', ticker: 'WEC' },
    { name: 'Wells Fargo', ticker: 'WFC' },
    { name: 'Welltower', ticker: 'WELL' },
    { name: 'Westinghouse Air Brake Technologies', ticker: 'WAB' },
    { name: 'Western Digital', ticker: 'WDC' },
    { name: 'Western Union', ticker: 'WU' },
    { name: 'WestRock', ticker: 'WRK' },
    { name: 'Weyerhaeuser', ticker: 'WY' },
    { name: 'Whirlpool Corporation', ticker: 'WHR' },
    { name: 'Williams Companies', ticker: 'WMB' },
    { name: 'Willis Towers Watson', ticker: 'WLTW' },
    { name: 'Wipro', ticker: 'WIT' },
    { name: 'Xcel Energy', ticker: 'XEL' },
    { name: 'Xerox', ticker: 'XRX' },
    { name: 'Yum! Brands', ticker: 'YUM' },
    { name: 'Zebra Technologies', ticker: 'ZBRA' },
    { name: 'Zimmer Biomet', ticker: 'ZBH' },
    { name: 'Zoetis', ticker: 'ZTS' }
  ];
  const companiesWithATFCF = await getCompaniesWithATFCF(companies);
  res.render('sp500', { companiesWithATFCF });
});

// Add cache clear endpoint
app.get('/clear-cache', (req, res) => {
  atfcfCache.clear();
  res.json({ message: 'Cache cleared successfully' });
});

app.listen(PORT, () => {
  console.log(`ATFCF web app running on http://localhost:${PORT}`);
  console.log(`Cache clear endpoint: http://localhost:${PORT}/clear-cache`);
}); 