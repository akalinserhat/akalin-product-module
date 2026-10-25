import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

export interface EnumItem {
    value: number;
    label: string;
    name: string;
}

export type EnumsMetadata = Record<string, EnumItem[]>;

export interface MetadataContextType {
    enums: EnumsMetadata;
    loading: boolean;
    error: string | null;
    refreshEnums: () => Promise<void>;
}

export const MetadataContext = createContext<MetadataContextType>({
    enums: {},
    loading: false,
    error: null,
    refreshEnums: async () => {}
});

export const MetadataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [enums, setEnums] = useState<EnumsMetadata>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEnums = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/Metadata/Enums');
            setEnums(response.data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load enums metadata:', err);
            setError('Enum verileri yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEnums();
    }, []);

    const value = React.useMemo(() => ({
        enums,
        loading,
        error,
        refreshEnums: fetchEnums
    }), [enums, loading, error]);

    return (
        <MetadataContext.Provider value={value}>
            {children}
        </MetadataContext.Provider>
    );
};

export const useMetadata = () => {
    return useContext(MetadataContext);
};

export default MetadataContext;
