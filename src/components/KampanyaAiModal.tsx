import React from 'react';
import { BaseAiAssistantModal } from '@akalin/ui';
import { KampanyaBelgesiCreateDto } from '../dtos/KampanyalarDto';

export interface KampanyaAiModalProps {
    onApply: (data: KampanyaBelgesiCreateDto, bulutDosyaId?: number | null) => void;
    onClose: () => void;
    isOpen?: boolean;
}

/**
 * KampanyaAiModal - Kampanya Belgesi için Yapay Zeka ve MCP Asistan Modal Adaptörü.
 * Merkezi BaseAiAssistantModal bileşenini kullanarak kampanya dökümanlarını analiz eder ve forma aktarır.
 */
const KampanyaAiModal: React.FC<KampanyaAiModalProps> = ({ onApply, onClose, isOpen = true }) => {
    return (
        <BaseAiAssistantModal
            isOpen={isOpen}
            onClose={onClose}
            documentType="KampanyaBelgesi"
            onApply={onApply}
        />
    );
};

export default KampanyaAiModal;
