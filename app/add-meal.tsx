import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import NutritionResultCard from '@/components/NutritionResultCard';
import ParticleBackground from '@/components/ParticleBackground';
import { BorderRadius, Colors, FontSizes, Gradients, MealTypeLabels, Spacing } from '@/constants/theme';
import { analyzeFoodImage } from '@/services/geminiService';
import { useMealStore } from '@/store/useMealStore';
import type { MealEntry, MealType, NutritionResult } from '@/types';

export default function AddMealScreen() {
  const router = useRouter();
  const addMeal = useMealStore((s) => s.addMeal);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera access is required to snap your food.');
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const nutritionResult = await analyzeFoodImage(imageUri, userNote);
      setResult(nutritionResult);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Cursed energy connection lost.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    if (!result || !imageUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

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

    await addMeal(meal);
    router.back();
  };

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <View style={styles.container}>
      <ParticleBackground />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>✕</Text>
            </Pressable>
            <Text style={styles.title}>Capture Technique</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Image picker buttons or preview */}
          {!imageUri ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.pickSection}>
              <Text style={styles.pickLabel}>Lock onto your target...</Text>
              <View style={styles.pickButtons}>
                <Pressable onPress={takePhoto} style={styles.pickButton}>
                  <LinearGradient
                    colors={Gradients.purpleToBlue}
                    style={styles.pickButtonGradient}
                  >
                    <Text style={styles.pickEmoji}>📷</Text>
                    <Text style={styles.pickButtonText}>Take Photo</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable onPress={pickFromGallery} style={styles.pickButton}>
                  <LinearGradient
                    colors={Gradients.darkCard}
                    style={[styles.pickButtonGradient, styles.galleryButton]}
                  >
                    <Text style={styles.pickEmoji}>🖼️</Text>
                    <Text style={styles.pickButtonText}>Gallery</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(400)}>
              {/* Photo preview */}
              <View style={styles.photoFrame}>
                <Image source={{ uri: imageUri }} style={styles.photoImage} />
                <Pressable
                  style={styles.changePhotoBtn}
                  onPress={() => {
                    setImageUri(null);
                    setResult(null);
                  }}
                >
                  <Text style={styles.changePhotoText}>Change</Text>
                </Pressable>
              </View>

              {/* Note input */}
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Combat Notes (optional)</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="e.g. 2 rotis, large bowl, approx 300g"
                  placeholderTextColor={Colors.textMuted}
                  value={userNote}
                  onChangeText={setUserNote}
                  multiline
                />
              </View>

              {/* Meal type selector */}
              <View style={styles.mealTypeContainer}>
                <Text style={styles.noteLabel}>Technique Type</Text>
                <View style={styles.mealTypeRow}>
                  {mealTypes.map((type) => {
                    const info = MealTypeLabels[type];
                    const isSelected = mealType === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => {
                          setMealType(type);
                          Haptics.selectionAsync();
                        }}
                        style={[
                          styles.mealTypeCard,
                          isSelected && styles.mealTypeCardSelected,
                        ]}
                      >
                        <Text style={styles.mealTypeEmoji}>
                          {type === 'breakfast'
                            ? '🌅'
                            : type === 'lunch'
                            ? '☀️'
                            : type === 'dinner'
                            ? '🌙'
                            : '⚡'}
                        </Text>
                        <Text
                          style={[
                            styles.mealTypeName,
                            isSelected && styles.mealTypeNameSelected,
                          ]}
                        >
                          {info.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Analyze button */}
              {!result && !isAnalyzing && (
                <Pressable onPress={analyzeFood} style={styles.analyzeBtn}>
                  <LinearGradient
                    colors={Gradients.purpleToRed}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.analyzeBtnGradient}
                  >
                    <Text style={styles.analyzeBtnText}>
                      Activate Analysis Technique
                    </Text>
                  </LinearGradient>
                </Pressable>
              )}

              {/* Loading state */}
              {isAnalyzing && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.jjkPurple} />
                  <Text style={styles.loadingText}>食物解析中...</Text>
                  <Text style={styles.loadingSubtext}>Analyzing food...</Text>
                </View>
              )}

              {/* Error */}
              {error && (
                <Animated.View entering={FadeIn} style={styles.errorContainer}>
                  <Text style={styles.errorText}>⚠️ {error}</Text>
                  <Pressable onPress={analyzeFood} style={styles.retryBtn}>
                    <Text style={styles.retryText}>Retry Analysis</Text>
                  </Pressable>
                </Animated.View>
              )}

              {/* Results */}
              {result && (
                <Animated.View entering={FadeInUp.duration(500)}>
                  <NutritionResultCard
                    result={result}
                    onUpdate={setResult}
                  />

                  {/* Save button */}
                  <Pressable onPress={saveMeal} style={styles.saveBtn}>
                    <LinearGradient
                      colors={[Colors.success, Colors.success + 'AA']}
                      style={styles.saveBtnGradient}
                    >
                      <Text style={styles.saveBtnText}>
                        Add to Today's Battle Log
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBg,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 18,
    color: Colors.textPrimary,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  pickSection: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  pickLabel: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  pickButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  pickButton: {
    flex: 1,
  },
  pickButtonGradient: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  galleryButton: {
    borderWidth: 1,
    borderColor: Colors.jjkPurple + '40',
  },
  pickEmoji: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  pickButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  photoFrame: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.jjkPurple + '40',
    marginBottom: Spacing.md,
  },
  photoImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  changePhotoBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primaryBg + 'CC',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  changePhotoText: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  noteContainer: {
    marginBottom: Spacing.md,
  },
  noteLabel: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  noteInput: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    borderWidth: 1,
    borderColor: Colors.jjkPurple + '20',
    minHeight: 60,
  },
  mealTypeContainer: {
    marginBottom: Spacing.lg,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mealTypeCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mealTypeCardSelected: {
    borderColor: Colors.jjkPurple,
    backgroundColor: Colors.jjkPurple + '15',
  },
  mealTypeEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  mealTypeName: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  mealTypeNameSelected: {
    color: Colors.jjkPurple,
  },
  analyzeBtn: {
    marginBottom: Spacing.md,
  },
  analyzeBtnGradient: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  analyzeBtnText: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    fontSize: FontSizes.xxl,
    color: Colors.jjkPurple,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  loadingSubtext: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  errorContainer: {
    backgroundColor: Colors.demonRed + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.demonRed + '30',
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.demonRed,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  retryBtn: {
    backgroundColor: Colors.cardBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  retryText: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: Spacing.md,
  },
  saveBtnGradient: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.primaryBg,
  },
});
