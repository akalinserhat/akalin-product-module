import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BirimForm from '../components/BirimForm';
import { useTranslation } from 'react-i18next';

const BirimFormPopup = () => {
  const { t } = useTranslation();
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const editId = searchParams.get('id');

  useEffect(() => {
    if (editId) {
      setLoading(true);
      axios.get(`/api/Birimler/${editId}`)
        .then(res => setInitialData(res.data))
        .catch(() => alert('Birim detayları alınamadı.'))
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const handleSuccess = (newId) => {
    if (window.opener) {
      window.opener.postMessage({ type: 'RECORD_ADDED', id: newId }, '*');
      window.close();
    } else {
      alert("İşlem başarılı ancak ana pencere bulunamadı.");
    }
  };

  const closeWindow = () => {
    if (isFormDirty) {
      if (!window.confirm("Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinize emin misiniz?")) return;
    }
    window.close();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeWindow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFormDirty]);

  return (
    <div className="surface-card" style={{ animation: 'fadeIn 0.3s' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
        {editId ? 'Birim Düzenle' : 'Yeni Birim Ekle'}
      </h3>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>{t('auto_yukleniyor_4deb')}</div>
      ) : (
        <BirimForm 
          initialData={initialData} 
          onSuccess={handleSuccess} 
          onCancel={closeWindow} 
          onDirtyChange={setIsFormDirty} 
          onSaveMemory={() => {}}
        />
      )}
    </div>
  );
};

export default BirimFormPopup;
