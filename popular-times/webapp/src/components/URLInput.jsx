import { useState } from 'react'

function URLInput({ onStartScraping, isScrapingActive }) {
  const [urls, setUrls] = useState('')
  const [inputMode, setInputMode] = useState('textarea') // 'textarea' or 'file'

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!urls.trim()) {
      alert('Bitte geben Sie mindestens eine URL ein')
      return
    }

    const urlList = urls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && url.startsWith('https://'))

    if (urlList.length === 0) {
      alert('Bitte geben Sie gültige URLs ein (müssen mit https:// beginnen)')
      return
    }

    onStartScraping(urlList)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUrls(event.target.result)
        setInputMode('textarea')
      }
      reader.readAsText(file)
    }
  }

  const loadSampleUrls = () => {
    const sampleUrls = `https://www.google.de/maps/place/Majestic+-+Caf%C3%A9+%26+Cocktailbar/@52.4836184,13.426421,16z/data=!4m10!1m2!2m1!1sbar!3m6!1s0x47a84f6e51648823:0x6986bef12d8acdb!8m2!3d52.4827079!4d13.431962!15sCgNiYXJaBSIDYmFykgEDYmFyqgE0EAEqByIDYmFyKAUyHhABIhr1YsOeeuz9pPLCXbmL2X-3_jbHIKEgInT2-zIHEAIiA2JhcuABAA!16s%2Fg%2F11trlr2rt6!5m1!1e4?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D
https://www.google.de/maps/place/Yorcks+BAR/@52.49323,13.3746128,16z/data=!3m1!5s0x47a8502f3aac12f1:0x4c9ea32304684d8c!4m13!1m5!2m4!1sbars!5m1!2e1!6e5!3m6!1s0x47a8502f25a9badb:0x5f5e56cc135e0bd8!8m2!3d52.49323!4d13.38414!15sCgRiYXJzWgYiBGJhcnOSAQNiYXKqATYQASoIIgRiYXJzKAUyHhABIhrCnwOeg471m0unc4LJtFstzTvf0V5kZO59mjIIEAIiBGJhcnPgAQA!16s%2Fg%2F1q69jvz2f!5m1!1e4?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D
https://www.google.de/maps/place/Bierbaum+3/@52.4755215,13.4230856,16z/data=!3m1!4b1!4m6!3m5!1s0x47a84f9600b53623:0x10ecc057c123abc2!8m2!3d52.4755215!4d13.4230856!16s%2Fg%2F1232zv_2g!5m1!1e4?entry=ttu&g_ep=EgoyMDI1MDYyMy4yIKXMDSoASAFQAw%3D%3D`
    setUrls(sampleUrls)
    setInputMode('textarea')
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Google Maps URLs</h3>
        <p className="card-description">
          Geben Sie die Google Maps URLs ein, die Sie analysieren möchten
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              className={`btn btn-sm ${inputMode === 'textarea' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setInputMode('textarea')}
            >
              Manuelle Eingabe
            </button>
            <button
              type="button"
              className={`btn btn-sm ${inputMode === 'file' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setInputMode('file')}
            >
              Datei hochladen
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={loadSampleUrls}
            >
              Beispiel-URLs laden
            </button>
          </div>

          {inputMode === 'textarea' ? (
            <>
              <label className="form-label">
                URLs (eine pro Zeile)
              </label>
              <textarea
                className="form-textarea"
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
                placeholder="https://www.google.de/maps/place/..."
                rows={6}
                disabled={isScrapingActive}
              />
            </>
          ) : (
            <>
              <label className="form-label">
                URLs-Datei auswählen (.txt)
              </label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="form-input"
                disabled={isScrapingActive}
              />
            </>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-secondary">
            {urls.split('\n').filter(url => url.trim() && url.startsWith('https://')).length} gültige URLs
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setUrls('')}
              disabled={isScrapingActive}
            >
              Leeren
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isScrapingActive || !urls.trim()}
            >
              {isScrapingActive ? (
                <>
                  <div className="loading mr-2"></div>
                  Scraping läuft...
                </>
              ) : (
                'Scraping starten'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default URLInput