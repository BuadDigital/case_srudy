const COND_OPTS = ["ممتاز", "جيد", "متوسط", "يحتاج صيانة", "مهجور"] as const;
const ACC_OPTS = ["سهل", "متوسط", "صعب", "غير ممكن"] as const;
const FIELD_LABELS = ["واجهة رئيسية", "المدخل", "الداخل", "المحيط"] as const;

export function FieldFormView() {
  return (
    <>
      <div className="note note-info">
        هذا النموذج مُحسَّن للموبايل — يفتحه المعاين في الميدان بجانب برنامج مقياس
      </div>
      <div className="field-form">
        <div className="field-sec-title">١ — بيانات العقار الأساسية</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="ff-id">
              رقم العقار
            </label>
            <input
              id="ff-id"
              className="form-control"
              defaultValue="E-4402"
              readOnly
              style={{ background: "var(--surface3)" }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ff-type">
              نوع العقار
            </label>
            <select id="ff-type" className="form-control" defaultValue="شقة">
              {["شقة", "أرض", "فيلا", "عمارة", "محل تجاري"].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ff-area">
              المنطقة / الحي
            </label>
            <input
              id="ff-area"
              className="form-control"
              placeholder="مثال: حي النزهة، مكة المكرمة"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ff-sqm">
              المساحة الفعلية (م²)
            </label>
            <input id="ff-sqm" className="form-control" type="number" placeholder="0.00" />
          </div>
        </div>
      </div>
      <div className="field-form">
        <div className="field-sec-title">٢ — حالة العقار</div>
        <div className="form-group">
          <span className="form-label">الحالة الإنشائية</span>
          <div className="radio-group">
            {COND_OPTS.map((o) => (
              <label key={o} className="radio-opt">
                <input type="radio" name="cond" /> {o}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <span className="form-label">هل يوجد منقولات داخل العقار؟</span>
          <div className="radio-group">
            <label className="radio-opt">
              <input type="radio" name="items" /> نعم
            </label>
            <label className="radio-opt">
              <input type="radio" name="items" /> لا
            </label>
          </div>
        </div>
        <div className="form-group">
          <span className="form-label">هل العقار مؤجر حالياً؟</span>
          <div className="radio-group">
            <label className="radio-opt">
              <input type="radio" name="rent" /> نعم
            </label>
            <label className="radio-opt">
              <input type="radio" name="rent" /> لا
            </label>
            <label className="radio-opt">
              <input type="radio" name="rent" /> غير معروف
            </label>
          </div>
        </div>
        <div className="form-group">
          <span className="form-label">إمكانية الوصول للعقار</span>
          <div className="radio-group">
            {ACC_OPTS.map((o) => (
              <label key={o} className="radio-opt">
                <input type="radio" name="acc" /> {o}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="field-form">
        <div className="field-sec-title">٣ — البيانات السوقية</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="ff-price">
              متوسط سعر م² في المنطقة
            </label>
            <input id="ff-price" className="form-control" type="number" placeholder="ريال / م²" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ff-market">
              مستوى نشاط السوق
            </label>
            <select id="ff-market" className="form-control" defaultValue="نشط">
              {["نشط جداً", "نشط", "متوسط", "ضعيف", "نادر"].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ff-mkt-note">
            ملاحظات سوقية إضافية
          </label>
          <textarea
            id="ff-mkt-note"
            className="form-control"
            rows={2}
            placeholder="أي معلومات إضافية عن السوق..."
          />
        </div>
      </div>
      <div className="field-form">
        <div className="field-sec-title">٤ — المستندات الموقعة</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="ff-sign-name">
              اسم الشخص المسؤول
            </label>
            <input id="ff-sign-name" className="form-control" placeholder="الاسم الكامل" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ff-sign-title">
              صفته
            </label>
            <select id="ff-sign-title" className="form-control" defaultValue="مالك">
              {["مالك", "وكيل", "مستأجر", "حارس"].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <span className="form-label">صور المستندات الموقعة</span>
          <div className="photo-grid">
            {["📷", "📷", "📷", "+"].map((icon, n) => (
              <button key={n} type="button" className="photo-ph">
                {icon}
                <span>{n < 3 ? "إضافة صورة" : "المزيد"}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="field-form">
        <div className="field-sec-title">٥ — صور العقار</div>
        <div className="photo-grid">
          {FIELD_LABELS.map((l) => (
            <button key={l} type="button" className="photo-ph">
              📷<span>{l}</span>
            </button>
          ))}
        </div>
        <div className="form-group" style={{ marginTop: 12 }}>
          <label className="form-label" htmlFor="ff-gen">
            ملاحظات عامة
          </label>
          <textarea id="ff-gen" className="form-control" rows={2} placeholder="أي ملاحظات إضافية..." />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn btn-primary">
          حفظ وإرسال
        </button>
        <button type="button" className="btn">
          حفظ مسودة
        </button>
      </div>
    </>
  );
}
