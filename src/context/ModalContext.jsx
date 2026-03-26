import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info, HelpCircle } from 'lucide-react';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    message: '',
    type: 'info', // 'info', 'success', 'error', 'confirm'
    onConfirm: null,
  });

  const showAlert = useCallback((message, type = 'info') => {
    setModalState({ isOpen: true, message, type, onConfirm: null });
  }, []);

  const showConfirm = useCallback((message, onConfirm) => {
    setModalState({ isOpen: true, message, type: 'confirm', onConfirm });
  }, []);

  const close = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    close();
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                {modalState.type === 'error' && <AlertCircle className="w-6 h-6 text-red-500" />}
                {modalState.type === 'success' && <CheckCircle className="w-6 h-6 text-green-500" />}
                {modalState.type === 'info' && <Info className="w-6 h-6 text-blue-500" />}
                {modalState.type === 'confirm' && <HelpCircle className="w-6 h-6 text-orange-500" />}
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalState.type === 'error' ? 'Error' : 
                   modalState.type === 'success' ? 'Success' : 
                   modalState.type === 'confirm' ? 'Confirm Action' : 'Notice'}
                </h3>
              </div>
              <button onClick={close} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">{modalState.message}</p>
            
            <div className="flex justify-end gap-3">
              {modalState.type === 'confirm' ? (
                <>
                  <button onClick={close} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                    Cancel
                  </button>
                  <button onClick={handleConfirm} className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors font-medium shadow-sm">
                    Confirm
                  </button>
                </>
              ) : (
                <button onClick={close} className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors font-medium shadow-sm w-full sm:w-auto">
                  Okay
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
