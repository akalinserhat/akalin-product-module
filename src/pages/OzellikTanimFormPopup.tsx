import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import OzellikTanimForm from '../components/OzellikTanimForm';

const OzellikTanimFormPopup = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [isFormDirty, setIsFormDirty] = useState(false);

  useEffect(() => {
    document.title = id ? 'Özellik Düzenle' : 'Yeni Özellik';
  }, [id]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  const handleSuccess = (newId) => {
    setIsFormDirty(false);
    if (window.opener) {
      window.opener.postMessage({ type: 'FORM_SUCCESS', entity: 'ozellikTanimlari', id: newId }, '*');
      window.close();
    } else {
      alert('Kayıt başarılı. Ancak ana pencere bulunamadı.');
    }
  };

  const handleCancel = () => {
    if (isFormDirty) {
      if (!window.confirm('Kaydedilmemiş değişiklikleriniz var. Çıkmak istediğinize emin misiniz?')) {
        return;
      }
    }
    window.close();
  };

  return (
    <div style={{ padding: '20px', background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <OzellikTanimForm 
        initialData={id ? { id } : null}
        preselectedGroupId={null}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        onDirtyChange={setIsFormDirty}
      />
    </div>
  );
};

export default OzellikTanimFormPopup;
