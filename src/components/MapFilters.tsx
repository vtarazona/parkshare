import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';

export interface FilterState {
  maxPricePerHour: number | null; // en euros
  radiusKm: number;
  sortBy: 'distance' | 'price' | 'rating';
}

const DEFAULT_FILTERS: FilterState = {
  maxPricePerHour: null,
  radiusKm: 2,
  sortBy: 'distance',
};

interface MapFiltersProps {
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  activeCount: number;
}

const PRICE_OPTIONS = [null, 1, 2, 3, 5] as const;
const RADIUS_OPTIONS = [0.5, 1, 2, 5] as const;

export default function MapFilters({ filters, onApply, activeCount }: MapFiltersProps) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<FilterState>(filters);

  const handleOpen = () => {
    setDraft(filters);
    setVisible(true);
  };

  const handleApply = () => {
    onApply(draft);
    setVisible(false);
  };

  const handleReset = () => {
    setDraft(DEFAULT_FILTERS);
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={handleOpen}>
        <Text style={styles.triggerIcon}>⚙️</Text>
        {activeCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={styles.closeText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filtros</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Restablecer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Precio máximo */}
            <Text style={styles.sectionLabel}>Precio máximo (€/hora)</Text>
            <View style={styles.chipRow}>
              {PRICE_OPTIONS.map((price) => {
                const isSelected = draft.maxPricePerHour === price;
                return (
                  <TouchableOpacity
                    key={price ?? 'any'}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setDraft({ ...draft, maxPricePerHour: price })}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {price === null ? 'Cualquiera' : `≤ ${price}€`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Radio de búsqueda */}
            <Text style={styles.sectionLabel}>Radio de búsqueda</Text>
            <View style={styles.chipRow}>
              {RADIUS_OPTIONS.map((km) => {
                const isSelected = draft.radiusKm === km;
                return (
                  <TouchableOpacity
                    key={km}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setDraft({ ...draft, radiusKm: km })}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {km < 1 ? `${km * 1000}m` : `${km} km`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Ordenar por */}
            <Text style={styles.sectionLabel}>Ordenar por</Text>
            <View style={styles.chipRow}>
              {(
                [
                  { key: 'distance', label: 'Distancia' },
                  { key: 'price', label: 'Precio' },
                  { key: 'rating', label: 'Valoración' },
                ] as const
              ).map(({ key, label }) => {
                const isSelected = draft.sortBy === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setDraft({ ...draft, sortBy: key })}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyText}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

export { DEFAULT_FILTERS };

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  triggerIcon: {
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#4A90D9',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  modal: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeText: {
    fontSize: 15,
    color: '#666',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  resetText: {
    fontSize: 15,
    color: '#4A90D9',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
    marginTop: 24,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipSelected: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  chipText: {
    fontSize: 14,
    color: '#444',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
