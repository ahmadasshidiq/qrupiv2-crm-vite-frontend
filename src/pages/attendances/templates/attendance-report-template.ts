export type AttendanceReportTemplateParams = {
  title: string;
  institutionName: string;
  institutionAddress: string;
  institutionPhone: string;
  institutionWebsite: string;
  schoolLogo: string;
  qrupiLogo: string;
  period: string;
  content: string;
  generatedAt: string;
};

export function buildAttendanceReportTemplate({
  title,
  institutionName,
  institutionAddress,
  institutionPhone,
  institutionWebsite,
  schoolLogo,
  qrupiLogo,
  period,
  content,
  generatedAt,
}: AttendanceReportTemplateParams) {
  return `<!doctype html>
<html>
  <head>
    <title>${title}</title>
    <style>
      * {
        box-sizing: border-box
      }

      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 36px;
        color: #172033;
        background: #fff
      }

      header {
        display: flex;
        justify-content: space-between;
        gap: 32px;
        border-bottom: 4px solid #2563eb;
        padding-bottom: 20px;
        position: relative
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 18px
      }

      .brand img {
        width: 76px;
        height: 76px;
        object-fit: contain
      }

      .qrupi {
        width: 130px !important;
        height: auto !important
      }

      .eyebrow {
        color: #2563eb;
        font-weight: 700;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px
      }

      h1 {
        margin: 5px 0 8px;
        font-size: 28px
      }

      h2.month-title {
        margin: 24px 0 -12px;
        font-size: 16px;
        color: #1d4ed8
      }

      .page-break {
        break-before: page
      }

      p {
        margin: 4px 0;
        color: #64748b;
        font-size: 12px
      }

      .period {
        margin-top: 14px;
        color: #1d4ed8;
        font-weight: 700;
        font-size: 16px
      }

      .meta {
        text-align: right;
        max-width: 330px
      }

      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-top: 24px;
        overflow: hidden;
        border: 1px solid #bfdbfe;
        border-radius: 8px
      }

      th,
      td {
        padding: 10px 12px;
        text-align: left;
        font-size: 12px
      }

      th {
        background: #dbeafe;
        color: #1e3a8a
      }

      .student-summary th,
      .student-summary td {
        border-right: 0
      }

      .student-summary tbody td {
        border-bottom: 1px solid #bfdbfe
      }

      tbody {
        position: relative;
        z-index: 1;
        box-shadow: inset 1px 0 #bfdbfe, inset -1px 0 #bfdbfe, inset 0 -1px #bfdbfe
      }

      .student-summary th,
      .student-summary td {
        font-size: 11px
      }

      .absence-title {
        margin: 28px 0 8px;
        font-size: 18px;
        color: #1d4ed8
      }

      .absence-details {
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        padding: 14px 18px;
        font-size: 12px;
        line-height: 1.8
      }

      .footer {
        margin-top: 24px;
        color: #94a3b8;
        font-size: 11px
      }

      @media print {
        body {
          padding: 0
        }

        @page {
          size: A4 landscape;
          margin: 12mm
        }

        header {
          break-inside: avoid
        }

        .page-break {
          break-before: page
        }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="brand">${schoolLogo ? ` <img src="${schoolLogo}" alt="Logo sekolah">` : ""} <div>
          <div class="eyebrow">${institutionName}</div>
          <h1>${title}</h1>
          <p>${institutionAddress || "Alamat institusi belum tersedia"}</p>
          <p>${[institutionPhone, institutionWebsite].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      <div class="meta">
        <img class="qrupi" src="${qrupiLogo}" alt="Qrupi">
        <div class="period">Periode: ${period}</div>
      </div>
    </header> ${content} <div class="footer">Dokumen ini dibuat melalui Qrupi · ${generatedAt}</div>
  </body>
</html>
`;
}
