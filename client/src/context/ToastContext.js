import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random().toString(36).substring(2, 6);
        const newToast = { id, message, type };

        setToasts((prev) => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
        return id;
    }, [removeToast]);

    const toast = {
        success: (msg, dur) => showToast(msg, 'success', dur),
        error: (msg, dur) => showToast(msg, 'error', dur),
        warning: (msg, dur) => showToast(msg, 'warning', dur),
        info: (msg, dur) => showToast(msg, 'info', dur),
    };

    // Attach to window so legacy non-React handlers can easily dispatch toasts
    useEffect(() => {
        window.toast = toast;
        return () => {
            delete window.toast;
        };
    }, [showToast]);

    const getToastStyle = (type) => {
        switch (type) {
            case 'success':
                return {
                    bg: '#F0FDF4',
                    border: '#86EFAC',
                    text: '#14532D',
                    icon: '✅',
                    bar: '#22C55E'
                };
            case 'error':
                return {
                    bg: '#FEF2F2',
                    border: '#FECACA',
                    text: '#7F1D1D',
                    icon: '❌',
                    bar: '#EF4444'
                };
            case 'warning':
                return {
                    bg: '#FFFBEB',
                    border: '#FDE68A',
                    text: '#78350F',
                    icon: '⚠️',
                    bar: '#F59E0B'
                };
            case 'info':
            default:
                return {
                    bg: '#EFF6FF',
                    border: '#BFDBFE',
                    text: '#1E3A8A',
                    icon: 'ℹ️',
                    bar: '#3B82F6'
                };
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, removeToast, toast }}>
            {children}
            {/* Toast Container */}
            <div
                style={{
                    position: 'fixed',
                    top: '24px',
                    right: '24px',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    maxWidth: '420px',
                    width: 'calc(100vw - 48px)',
                    pointerEvents: 'none',
                }}
            >
                {toasts.map((t) => {
                    const styleConfig = getToastStyle(t.type);
                    return (
                        <div
                            key={t.id}
                            style={{
                                pointerEvents: 'auto',
                                backgroundColor: styleConfig.bg,
                                border: `1.5px solid ${styleConfig.border}`,
                                color: styleConfig.text,
                                borderRadius: '12px',
                                padding: '14px 16px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                fontSize: '14.5px',
                                lineHeight: '1.45',
                                fontWeight: 500,
                                position: 'relative',
                                overflow: 'hidden',
                                animation: 'toastSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                            }}
                        >
                            {/* Color Accent Indicator Strip */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    bottom: 0,
                                    width: '5px',
                                    backgroundColor: styleConfig.bar,
                                }}
                            />
                            <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>
                                {styleConfig.icon}
                            </span>
                            <div style={{ flex: 1, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                                {t.message}
                            </div>
                            <button
                                onClick={() => removeToast(t.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: styleConfig.text,
                                    opacity: 0.6,
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    padding: '0 4px',
                                    lineHeight: 1,
                                    flexShrink: 0,
                                    fontWeight: 'bold',
                                }}
                                aria-label="Dismiss toast"
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes toastSlideIn {
                    from {
                        transform: translateX(110%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @media (max-width: 640px) {
                    div[style*="top: 24px"] {
                        top: 16px !important;
                        right: 16px !important;
                        left: 16px !important;
                        width: auto !important;
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        // Fallback dummy if used outside provider
        return {
            showToast: (msg) => console.log(msg),
            removeToast: () => {},
            toast: {
                success: (msg) => console.log('SUCCESS:', msg),
                error: (msg) => console.error('ERROR:', msg),
                warning: (msg) => console.warn('WARN:', msg),
                info: (msg) => console.log('INFO:', msg),
            },
        };
    }
    return context;
};
