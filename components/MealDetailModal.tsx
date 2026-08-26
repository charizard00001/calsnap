import Chip from '@/components/ui/Chip';
import Icon from '@/components/ui/Icon';
import Sticker from '@/components/ui/Sticker';
import StickerPressable from '@/components/ui/StickerPressable';
import { Colors, Fonts, MealTypeColor, MealTypeLabels } from '@/constants/theme';
import { useAddMeal, useUpdateMeal } from '@/hooks/useDailyLog';
import { notify } from '@/lib/confirm';
import { sfx } from '@/lib/sfx';
import type { MealEntry } from '@/types';
import { formatDisplayDate, getTodayKey, parseDateKey } from '@/utils/dateHelpers';
import * as Crypto from 'expo-crypto';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MealDetailModalProps {
  meal: MealEntry | null;
  date: string;
  onClose: () => void;
}

export default function MealDetailModal({ meal, date, onClose }: MealDetailModalProps) {
  const insets = useSafeAreaInsets();
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

  const mealInfo = MealTypeLabels[meal.mealType] || { label: 'Meal', rank: '' };
  const typeColor = MealTypeColor[meal.mealType] ?? Colors.accentGold;

  const handleSave = async () => {
    sfx('chime');
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
    sfx('fanfare');
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
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>MEAL DETAILS</Text>
              <StickerPressable
                color={Colors.paper}
                radius={999}
                shadow={0}
                onPress={onClose}
                contentStyle={styles.closeBtn}
                accessibilityLabel="Close"
              >
                <Icon name="close" size={20} color={Colors.ink} strokeWidth={3} />
              </StickerPressable>
            </View>

            {meal.photoUri ? (
              <Pressable onPress={() => setPhotoOpen(true)} style={styles.photoWrap}>
                <Image source={{ uri: meal.photoUri }} style={styles.photo} />
              </Pressable>
            ) : null}

            <View style={styles.metaRow}>
              <Chip label={(mealInfo.rank || mealInfo.label).toUpperCase()} color={typeColor} />
              <Text style={styles.metaText}>
                {formatDisplayDate(parseDateKey(date || getTodayKey()))}
              </Text>
            </View>

            <Text style={styles.label}>FOOD NAME</Text>
            <TextInput style={styles.textInput} value={foodName} onChangeText={setFoodName} />

            <View style={styles.grid}>
              <NumberField label="CALORIES" value={calories} onChangeText={setCalories} />
              <NumberField label="PROTEIN (G)" value={protein} onChangeText={setProtein} />
              <NumberField label="CARBS (G)" value={carbs} onChangeText={setCarbs} />
              <NumberField label="FAT (G)" value={fat} onChangeText={setFat} />
            </View>

            <StickerPressable
              color={Colors.accentPrimary}
              radius={18}
              shadow={5}
              border={3}
              sound={null}
              onPress={handleSave}
              contentStyle={styles.saveBtn}
            >
              <Icon name="check" size={20} color={Colors.ink} strokeWidth={3} />
              <Text style={styles.saveText}>SAVE CHANGES</Text>
            </StickerPressable>

            <StickerPressable
              color={Colors.cardBg}
              borderColor={Colors.accentSecondary}
              radius={18}
              shadow={0}
              sound={null}
              onPress={handleRelog}
              contentStyle={styles.relogBtn}
            >
              <Icon name="repeat" size={19} color={Colors.accentSecondary} />
              <Text style={styles.relogText}>RE-LOG TO TODAY</Text>
            </StickerPressable>
          </ScrollView>
        </View>
      </View>

      <Modal
        visible={photoOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setPhotoOpen(false)}
      >
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
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.ink,
    padding: 16,
    maxHeight: '86%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 19,
    color: Colors.paper,
  },
  closeBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoWrap: {
    marginBottom: 12,
  },
  photo: {
    width: '100%',
    height: 210,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: Colors.ink,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  metaText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  label: {
    fontFamily: Fonts.display,
    fontSize: 10,
    letterSpacing: 0.8,
    color: Colors.accentLime,
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: Colors.primaryBg,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.hairline,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 46,
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.paper,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  numberField: {
    width: '47%',
    flexGrow: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 15,
    marginTop: 4,
  },
  saveText: {
    fontFamily: Fonts.display,
    fontSize: 14,
    color: Colors.ink,
  },
  relogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 14,
    marginTop: 12,
  },
  relogText: {
    fontFamily: Fonts.display,
    fontSize: 13,
    color: Colors.accentSecondary,
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
