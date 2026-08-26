import { BorderRadius, Colors, FontSizes, MealTypeLabels, Spacing } from '@/constants/theme';
import { useAddMeal, useUpdateMeal } from '@/hooks/useDailyLog';
import { notify } from '@/lib/confirm';
import type { MealEntry } from '@/types';
import { formatDisplayDate, getTodayKey, parseDateKey } from '@/utils/dateHelpers';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

interface MealDetailModalProps {
  meal: MealEntry | null;
  date: string;
  onClose: () => void;
}

export default function MealDetailModal({ meal, date, onClose }: MealDetailModalProps) {
  const updateMealMutation = useUpdateMeal();
  const addMealMutation = useAddMeal();

  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('0');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fat, setFat] = useState('0');
  const [photoOpen, setPhotoOpen] = useState(false);

  useEffect(() => {
    if (!meal) return;
    setFoodName(meal.foodName);
    setCalories(String(meal.calories));
    setProtein(String(meal.protein));
    setCarbs(String(meal.carbs));
    setFat(String(meal.fat));
    setPhotoOpen(false);
  }, [meal]);

  if (!meal) return null;

  const mealInfo = MealTypeLabels[meal.mealType] || { label: 'Meal' };

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateMealMutation.mutateAsync({
      date,
      mealId: meal.id,
      updates: {
        foodName: foodName.trim() || meal.foodName,
        calories: parseInt(calories, 10) || 0,
        protein: parseInt(protein, 10) || 0,
        carbs: parseInt(carbs, 10) || 0,
        fat: parseInt(fat, 10) || 0,
      },
    });
    onClose();
  };

  const handleRelog = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const relogged: MealEntry = {
      ...meal,
      id: Crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    await addMealMutation.mutateAsync({ date: getTodayKey(), meal: relogged });
    notify('Re-logged', `${meal.foodName} added to today's log.`);
    onClose();
  };

  return (
    <Modal visible={!!meal} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Meal Details</Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>

            {meal.photoUri ? (
              <Pressable onPress={() => setPhotoOpen(true)}>
                <Image source={{ uri: meal.photoUri }} style={styles.photo} />
              </Pressable>
            ) : null}

            <Text style={styles.mealMeta}>
              {mealInfo.label} · {formatDisplayDate(parseDateKey(date))}
            </Text>

            <Text style={styles.label}>Food name</Text>
            <TextInput
              style={styles.textInput}
              value={foodName}
              onChangeText={setFoodName}
            />

            <View style={styles.statsGrid}>
              <NumberField label="Calories (kcal)" value={calories} onChangeText={setCalories} />
              <NumberField label="Protein (g)" value={protein} onChangeText={setProtein} />
              <NumberField label="Carbs (g)" value={carbs} onChangeText={setCarbs} />
              <NumberField label="Fat (g)" value={fat} onChangeText={setFat} />
            </View>

            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </Pressable>

            <Pressable style={styles.relogBtn} onPress={handleRelog}>
              <Text style={styles.relogBtnText}>🔁 Re-log to Today</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>

      {/* Full-size photo viewer */}
      <Modal visible={photoOpen} animationType="fade" transparent onRequestClose={() => setPhotoOpen(false)}>
        <Pressable style={styles.photoBackdrop} onPress={() => setPhotoOpen(false)}>
          {meal.photoUri ? (
            <Image source={{ uri: meal.photoUri }} style={styles.fullPhoto} resizeMode="contain" />
          ) : null}
        </Pressable>
      </Modal>
    </Modal>
  );
}

function NumberField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={styles.numberField}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        selectTextOnFocus
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000099',
  },
  sheet: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.md,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: Colors.textPrimary,
    fontSize: 16,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  mealMeta: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    borderWidth: 1,
    borderColor: Colors.accentPrimary + '20',
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  numberField: {
    width: '47%',
  },
  saveBtn: {
    backgroundColor: Colors.accentPrimary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveBtnText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: FontSizes.md,
  },
  relogBtn: {
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accentSecondary + '40',
  },
  relogBtnText: {
    color: Colors.accentSecondary,
    fontWeight: '700',
    fontSize: FontSizes.md,
  },
  photoBackdrop: {
    flex: 1,
    backgroundColor: '#000000EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullPhoto: {
    width: '100%',
    height: '80%',
  },
});
