import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function TermsScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        <Text style={styles.updated}>Última actualización: febrero 2025</Text>

        <Text style={styles.intro}>
          Al registrarte en ParkShare aceptas estos Términos y Condiciones. Léelos con atención
          antes de usar la plataforma.
        </Text>

        {/* 1 */}
        <Text style={styles.sectionTitle}>1. ¿Qué es ParkShare?</Text>
        <Text style={styles.body}>
          ParkShare es una plataforma que conecta a <Text style={styles.bold}>propietarios de plazas de parking</Text> con{' '}
          <Text style={styles.bold}>conductores</Text> que necesitan aparcar. ParkShare actúa como intermediario
          tecnológico y no es propietario de ninguna plaza de parking.
        </Text>

        {/* 2 */}
        <Text style={styles.sectionTitle}>2. Registro y cuenta</Text>
        <Text style={styles.bullet}>• Debes tener al menos 18 años para usar ParkShare.</Text>
        <Text style={styles.bullet}>• La información que proporciones debe ser veraz y actualizada.</Text>
        <Text style={styles.bullet}>• Eres responsable de mantener la confidencialidad de tu contraseña.</Text>
        <Text style={styles.bullet}>• Una persona solo puede tener una cuenta activa.</Text>
        <Text style={styles.bullet}>• ParkShare se reserva el derecho a suspender cuentas que incumplan estos términos.</Text>

        {/* 3 */}
        <Text style={styles.sectionTitle}>3. Publicación de plazas (propietarios)</Text>
        <Text style={styles.bullet}>• Solo puedes publicar plazas de las que seas propietario o tengas derecho de uso.</Text>
        <Text style={styles.bullet}>• La información de la plaza (ubicación, precio, disponibilidad) debe ser exacta.</Text>
        <Text style={styles.bullet}>• El precio mínimo es 0,50 € y el máximo 100 € por reserva.</Text>
        <Text style={styles.bullet}>• Eres responsable de que la plaza esté disponible durante el tiempo reservado.</Text>
        <Text style={styles.bullet}>• ParkShare retiene un <Text style={styles.bold}>20% de comisión</Text> sobre cada reserva completada.</Text>
        <Text style={styles.bullet}>• Para recibir pagos debes completar la verificación Stripe Connect.</Text>

        {/* 4 */}
        <Text style={styles.sectionTitle}>4. Reservas (conductores)</Text>
        <Text style={styles.bullet}>• Al reservar una plaza te comprometes a llegar en un máximo de 5 minutos.</Text>
        <Text style={styles.bullet}>• Si no llegas en el plazo indicado, la reserva se cancela automáticamente.</Text>
        <Text style={styles.bullet}>• El pago se procesa al finalizar la sesión de parking.</Text>
        <Text style={styles.bullet}>• Las reservas canceladas por incumplimiento del tiempo de llegada no se reembolsan si el propietario ya desplazó su plaza.</Text>

        {/* 5 */}
        <Text style={styles.sectionTitle}>5. Pagos y comisiones</Text>
        <Text style={styles.body}>
          Los pagos se procesan a través de <Text style={styles.bold}>Stripe</Text>, plataforma de pagos segura regulada en Europa.
        </Text>
        <Text style={styles.bullet}>• El conductor paga el 100% del precio acordado.</Text>
        <Text style={styles.bullet}>• El propietario recibe el <Text style={styles.bold}>80%</Text> del importe.</Text>
        <Text style={styles.bullet}>• ParkShare retiene el <Text style={styles.bold}>20%</Text> como comisión de servicio.</Text>
        <Text style={styles.bullet}>• Los pagos al propietario se realizan según los términos de Stripe Connect (generalmente 2-7 días hábiles).</Text>
        <Text style={styles.bullet}>• En caso de disputa, ParkShare actuará como mediador pero no garantiza el reembolso.</Text>

        {/* 6 */}
        <Text style={styles.sectionTitle}>6. Suscripciones</Text>
        <Text style={styles.body}>
          ParkShare ofrece planes de suscripción opcionales (Basic y Premium) con ventajas adicionales.
        </Text>
        <Text style={styles.bullet}>• Las suscripciones se renuevan automáticamente cada mes.</Text>
        <Text style={styles.bullet}>• Puedes cancelar en cualquier momento desde la sección "Plan de suscripción".</Text>
        <Text style={styles.bullet}>• La cancelación es efectiva al final del período de facturación en curso.</Text>
        <Text style={styles.bullet}>• No se realizan reembolsos proporcionales por cancelaciones anticipadas.</Text>

        {/* 7 */}
        <Text style={styles.sectionTitle}>7. Conducta prohibida</Text>
        <Text style={styles.body}>Está terminantemente prohibido:</Text>
        <Text style={styles.bullet}>• Publicar plazas ficticias o en ubicaciones incorrectas.</Text>
        <Text style={styles.bullet}>• Usar ParkShare para actividades ilegales.</Text>
        <Text style={styles.bullet}>• Acosar, amenazar o insultar a otros usuarios.</Text>
        <Text style={styles.bullet}>• Manipular el sistema de valoraciones.</Text>
        <Text style={styles.bullet}>• Realizar pagos fuera de la plataforma para eludir comisiones.</Text>
        <Text style={styles.bullet}>• Crear múltiples cuentas para obtener ventajas indebidas.</Text>

        {/* 8 */}
        <Text style={styles.sectionTitle}>8. Responsabilidad</Text>
        <Text style={styles.body}>
          ParkShare es una plataforma de conexión y <Text style={styles.bold}>no se responsabiliza</Text> de:
        </Text>
        <Text style={styles.bullet}>• Daños en vehículos producidos durante el uso de la plaza.</Text>
        <Text style={styles.bullet}>• Robos u otras incidencias en las plazas publicadas.</Text>
        <Text style={styles.bullet}>• Incumplimientos por parte de propietarios o conductores.</Text>
        <Text style={styles.body}>
          Recomendamos que los propietarios dispongan de seguro multirriesgo del hogar que cubra
          su plaza de parking.
        </Text>

        {/* 9 */}
        <Text style={styles.sectionTitle}>9. Valoraciones</Text>
        <Text style={styles.bullet}>• Las valoraciones deben ser honestas y basadas en experiencias reales.</Text>
        <Text style={styles.bullet}>• ParkShare puede eliminar valoraciones que incumplan estas normas.</Text>
        <Text style={styles.bullet}>• No está permitido solicitar valoraciones a cambio de compensaciones.</Text>

        {/* 10 */}
        <Text style={styles.sectionTitle}>10. Propiedad intelectual</Text>
        <Text style={styles.body}>
          La marca ParkShare, el logotipo, el diseño de la app y el código fuente son propiedad
          exclusiva de ParkShare SL. Queda prohibida su reproducción sin autorización expresa.
        </Text>

        {/* 11 */}
        <Text style={styles.sectionTitle}>11. Modificaciones</Text>
        <Text style={styles.body}>
          ParkShare puede modificar estos términos. Te notificaremos con al menos 15 días de
          antelación antes de que los cambios entren en vigor. Si continúas usando la plataforma
          tras la fecha indicada, se considera que aceptas los nuevos términos.
        </Text>

        {/* 12 */}
        <Text style={styles.sectionTitle}>12. Legislación aplicable</Text>
        <Text style={styles.body}>
          Estos términos se rigen por la legislación española. Para cualquier disputa, las partes
          se someten a los juzgados y tribunales del domicilio del usuario, conforme a lo previsto
          en la normativa de consumidores y usuarios.
        </Text>

        <Text style={styles.contact}>
          ¿Dudas sobre los términos? Escríbenos a legal@parkshare.es
        </Text>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  updated: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    textAlign: 'right',
  },
  intro: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginTop: 24,
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 4,
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
  contact: {
    fontSize: 14,
    color: '#4A90D9',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 16,
    fontWeight: '500',
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4A90D9',
    borderRadius: 10,
    marginTop: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
