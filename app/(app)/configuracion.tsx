import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { router, Stack } from 'expo-router';
import { useAuthStore } from '../../src/presentation/store/auth-store';
import { useSettingsStore } from '../../src/presentation/store/settings-store';
import { canManageSettings } from '../../src/presentation/utils/role-access';
import { FormNumberField } from '../../src/presentation/components/ui/FormNumberField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { configFormSchema, type ConfigFormValues } from '../../src/presentation/forms/config-form-schema';
import { screenPadding } from '../../src/presentation/theme/app-theme';

export default function ConfiguracionScreen() {
  const user = useAuthStore((s) => s.user);
  const settings = useSettingsStore();
  const setDefaults = useSettingsStore((s) => s.setDefaults);
  const reset = useSettingsStore((s) => s.reset);

  useEffect(() => {
    if (!canManageSettings(user?.role)) {
      router.replace('/(app)/dashboard');
    }
  }, [user?.role]);

  const { control, handleSubmit } = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    mode: 'onChange',
    defaultValues: {
      factor: settings.factor,
      recPercentGold: settings.recPercentGold,
      recPercentSilver: settings.recPercentSilver,
      rcGold: settings.rcGold,
      rcSilver: settings.rcSilver,
      consumos: settings.consumos,
      flete: settings.flete,
      interGold: settings.interGold,
      interSilver: settings.interSilver,
    },
  });

  const onSave = handleSubmit(async (values) => {
    await setDefaults(values);
    router.back();
  });

  if (!canManageSettings(user?.role)) {
    return (
      <View style={styles.denied}>
        <Text variant="bodyLarge" style={styles.deniedText}>
          No tiene permiso para ver esta sección.
        </Text>
        <Text variant="bodyMedium" style={styles.deniedSub}>
          La configuración de valores iniciales está disponible solo para administradores.
        </Text>
        <Button mode="contained" onPress={() => router.replace('/(app)/dashboard')} style={{ marginTop: 16 }}>
          Volver al inicio
        </Button>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Configuración', headerShown: true }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="bodyMedium" style={styles.hint}>
          Valores iniciales que se aplican al crear una nueva cotización. Perfil administrador.
        </Text>
        <FormNumberField control={control} name="factor" label="Factor comercial" />
        <FormNumberField control={control} name="recPercentGold" label="REC oro (%)" />
        <FormNumberField control={control} name="recPercentSilver" label="REC plata (%)" />
        <FormNumberField control={control} name="rcGold" label="RC oro (US$/oz)" />
        <FormNumberField control={control} name="rcSilver" label="RC plata (US$/oz)" />
        <FormNumberField control={control} name="consumos" label="Consumos (US$/TMS)" />
        <FormNumberField control={control} name="flete" label="Flete (US$/TMS)" />
        <FormNumberField control={control} name="interGold" label="INTER oro (US$)" />
        <FormNumberField control={control} name="interSilver" label="INTER plata (US$)" />
        <Button mode="contained" onPress={onSave} style={styles.btn} contentStyle={styles.btnContent}>
          Guardar valores iniciales
        </Button>
        <Button mode="outlined" onPress={() => void reset()} style={styles.btn}>
          Restaurar valores del cotizador
        </Button>
        <Button mode="text" onPress={() => router.back()}>
          Volver
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: screenPadding, paddingBottom: 40 },
  denied: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  deniedText: { textAlign: 'center', fontWeight: '600' },
  deniedSub: { textAlign: 'center', marginTop: 8, opacity: 0.75 },
  hint: { marginBottom: 16, opacity: 0.75 },
  btn: { marginTop: 8 },
  btnContent: { paddingVertical: 10 },
});
