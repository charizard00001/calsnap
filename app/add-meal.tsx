import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import NutritionResultCard from '@/components/NutritionResultCard';
import ArcadeBg from '@/components/ui/ArcadeBg';
import Confetti from '@/components/ui/Confetti';
import Icon from '@/components/ui/Icon';
import Marquee from '@/components/ui/Marquee';
import Sticker from '@/components/ui/Sticker';
import StickerPressable from '@/components/ui/StickerPressable';
import {
  Colors,
  Fonts,
  MealTypeColor,
  MealTypeShort,
} from '@/constants/theme';
import { useAddMeal } from '@/hooks/useDailyLog';
import { notify } from '@/lib/confirm';
import { sfx } from '@/lib/sfx';
import { analyzeFoodImage } from '@/services/geminiService';
import type { MealEntry, MealType, NutritionResult } from '@/types';
import { getTodayKey } from '@/utils/dateHelpers';

export default function AddMealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addMealMutation = useAddMeal();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [burst, setBurst] = useState(0);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      notify('Permission needed', 'Camera access is required to snap your food.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setResult(null);
      setError(null);
    }
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setResult(null);
      setError(null);
    }
  };

  const analyzeFood = async () => {
    if (!imageUri) return;
    setIsAnalyzing(true);
    setError(null);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const nutritionResult = await analyzeFoodImage(imageUri, userNote);
      setResult(nutritionResult);
      sfx('chime');
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Check your connection and try again.');
      sfx('error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    if (!result || !imageUri) return;
    setBurst((n) => n + 1);
    sfx('fanfare');

    const meal: MealEntry = {
      id: Crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      mealType,
      photoUri: imageUri,
      userNote,
      foodName: result.foodName,
      description: result.description,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
      confidence: result.confidence,
    };

    await addMealMutation.mutateAsync({ date: getTodayKey(), meal });
    router.back();
  };

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <View style={styles.container}>
      <ArcadeBg glows={[Colors.accentViolet, Colors.accentLime]} />

      <View style={{ height: insets.top }} />

      <View style={styles.header}>
        <StickerPressable
          color={Colors.paper}
          radius={14}
          shadow={4}
          onPress={() => router.back()}
          contentStyle={styles.iconBtn}
          accessibilityLabel="Close"
        >
          <Icon name="close" size={22} color={Colors.ink} strokeWidth={3} />
        </StickerPressable>
        <Text style={styles.title}>FEED THE AI</Text>
        <View style={styles.iconBtnSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!imageUri ? (
            <View style={styles.pickSection}>
              <Sticker
                color={Colors.accentWarm}
                radius={24}
                shadow={6}
                border={4}
                contentStyle={styles.emptyFrame}
              >
                <Icon name="camera" size={54} color={Colors.ink} strokeWidth={1.8} />
                <Text style={styles.emptyFrameText}>SNAP OR UPLOAD A PLATE</Text>
              </Sticker>

              <View style={styles.pickRow}>
                <StickerPressable
                  color={Colors.accentSecondary}
                  radius={18}
                  shadow={5}
                  onPress={takePhoto}
                  style={styles.flex}
                  contentStyle={styles.pickBtn}
                >
                  <Icon name="camera" size={26} color={Colors.ink} />
                  <Text style={styles.pickBtnText}>CAMERA</Text>
                </StickerPressable>
                <StickerPressable
                  color={Colors.paper}
                  radius={18}
                  shadow={5}
                  onPress={pickFromGallery}
                  style={styles.flex}
                  contentStyle={styles.pickBtn}
                >
                  <Icon name="image" size={26} color={Colors.ink} />
                  <Text style={styles.pickBtnText}>GALLERY</Text>
                </StickerPressable>
              </View>
            </View>
          ) : (
            <View style={styles.body}>
              <View style={styles.photoWrap}>
                <View style={styles.photoShadow} />
                <Image source={{ uri: imageUri }} style={styles.photo} />
                <Pressable
                  style={styles.changeBtn}
                  onPress={() => {
                    sfx('tap');
                    setImageUri(null);
                    setResult(null);
                  }}
                >
                  <Text style={styles.changeText}>CHANGE</Text>
                </Pressable>
              </View>

              <View style={styles.block}>
                <Text style={styles.blockLabel}>WHEN WAS THIS?</Text>
                <View style={styles.typeRow}>
                  {mealTypes.map((type) => {
                    const isSelected = mealType === type;
                    const color = MealTypeColor[type];
                    return (
                      <StickerPressable
                        key={type}
                        color={isSelected ? color : Colors.hairline}
                        radius={14}
                        shadow={isSelected ? 4 : 0}
                        onPress={() => setMealType(type)}
                        style={styles.flex}
                        contentStyle={styles.typeBtn}
                      >
                        <Text
                          style={[styles.typeText, !isSelected && styles.typeTextIdle]}
                        >
                          {MealTypeShort[type]}
                        </Text>
                      </StickerPressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.block}>
                <Text style={styles.blockLabel}>TELL SNAPPY MORE</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="2 rotis, big bowl of dal, approx 300g…"
                  placeholderTextColor={Colors.textMuted}
                  value={userNote}
                  onChangeText={setUserNote}
                  multiline
                />
              </View>

              {!result && !isAnalyzing && (
                <StickerPressable
                  color={Colors.accentLime}
                  radius={20}
                  shadow={6}
                  border={4}
                  sound="boing"
                  onPress={analyzeFood}
                  contentStyle={styles.cta}
                >
                  <Icon name="star" size={24} color={Colors.ink} strokeWidth={2.8} />
                  <Text style={styles.ctaText}>ANALYZE IT</Text>
                </StickerPressable>
              )}

              {isAnalyzing && (
                <Sticker
                  color={Colors.accentViolet}
                  radius={22}
                  shadow={6}
                  border={4}
                  contentStyle={styles.loadingCard}
                >
                  <ActivityIndicator size="large" color={Colors.ink} />
                  <View style={styles.loadingCopy}>
                    <Text style={styles.loadingTitle}>CHEWING ON IT…</Text>
                    <Text style={styles.loadingSub}>Squinting at your plate</Text>
                  </View>
                </Sticker>
              )}

              {error && (
                <View>
                  <Sticker
                    color={Colors.accentHot}
                    radius={20}
                    shadow={5}
                    contentStyle={styles.errorCard}
                  >
                    <View style={styles.errorHead}>
                      <Icon name="warning" size={22} color={Colors.ink} strokeWidth={2.8} />
                      <Text style={styles.errorTitle}>THAT DIDN&apos;T WORK</Text>
                    </View>
                    <Text style={styles.errorBody}>{error}</Text>
                    <StickerPressable
                      color={Colors.ink}
                      radius={14}
                      shadow={0}
                      onPress={analyzeFood}
                      contentStyle={styles.retryBtn}
                    >
                      <Icon name="repeat" size={18} color={Colors.paper} />
                      <Text style={styles.retryText}>TRY AGAIN</Text>
                    </StickerPressable>
                  </Sticker>
                </View>
              )}

              {result && (
                <View style={styles.resultBlock}>
                  <NutritionResultCard result={result} onUpdate={setResult} />

                  <View style={styles.saveWrap}>
                    <Confetti trigger={burst} count={18} spread={90} />
                    <StickerPressable
                      color={Colors.accentLime}
                      radius={20}
                      shadow={6}
                      border={4}
                      sound={null}
                      onPress={saveMeal}
                      contentStyle={styles.cta}
                    >
                      <Icon name="check" size={24} color={Colors.ink} strokeWidth={3} />
                      <Text style={styles.ctaText}>ADD TO TODAY</Text>
                    </StickerPressable>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Marquee
        text="NO TYPING ★ JUST PHOTOS"
        color={Colors.accentGold}
        duration={13}
        height={32}
        style={{ marginBottom: insets.bottom }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnSpacer: {
    width: 46,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.paper,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  pickSection: {
    gap: 16,
  },
  emptyFrame: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyFrameText: {
    fontFamily: Fonts.display,
    fontSize: 13,
    color: Colors.ink,
  },
  pickRow: {
    flexDirection: 'row',
    gap: 11,
  },
  pickBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 15,
  },
  pickBtnText: {
    fontFamily: Fonts.display,
    fontSize: 12,
    color: Colors.ink,
  },
  body: {
    gap: 16,
  },
  photoWrap: {
    position: 'relative',
  },
  photoShadow: {
    position: 'absolute',
    left: 6,
    top: 6,
    right: -6,
    bottom: -6,
    backgroundColor: Colors.ink,
    borderRadius: 24,
  },
  photo: {
    width: '100%',
    height: 250,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: Colors.ink,
    backgroundColor: Colors.cardBg,
  },
  changeBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: Colors.ink,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: Colors.paper,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 34,
    justifyContent: 'center',
  },
  changeText: {
    fontFamily: Fonts.display,
    fontSize: 10,
    color: Colors.accentLime,
  },
  block: {
    gap: 8,
  },
  blockLabel: {
    fontFamily: Fonts.display,
    fontSize: 12,
    letterSpacing: 1,
    color: Colors.accentLime,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  typeText: {
    fontFamily: Fonts.display,
    fontSize: 9,
    color: Colors.ink,
  },
  typeTextIdle: {
    color: Colors.textSecondary,
  },
  noteInput: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Colors.paper,
    padding: 13,
    minHeight: 76,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.paper,
    textAlignVertical: 'top',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
  },
  ctaText: {
    fontFamily: Fonts.display,
    fontSize: 17,
    color: Colors.ink,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  loadingCopy: {
    flex: 1,
    gap: 3,
  },
  loadingTitle: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.ink,
  },
  loadingSub: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.ink,
    opacity: 0.75,
  },
  errorCard: {
    padding: 15,
    gap: 10,
  },
  errorHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    fontFamily: Fonts.display,
    fontSize: 13,
    color: Colors.ink,
  },
  errorBody: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.ink,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
  },
  retryText: {
    fontFamily: Fonts.display,
    fontSize: 12,
    color: Colors.paper,
  },
  resultBlock: {
    gap: 14,
  },
  saveWrap: {
    position: 'relative',
  },
});
