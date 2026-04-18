import { getDeliveryPoints, calculateTariff, calculateTariffList } from './src/lib/cdek.ts';

const config = {
  clientId: 'wqGwiQx0gg8mLtiEKsUinjVSICCjtTEP',
  clientSecret: 'RmAmgvSgSl1yirlz9QupbzOJVqhCxcP5',
  testMode: true,
  senderCityCode: '119',
  defaultTariffCode: 234
};

async function main() {
  try {
    // Test mode has limited cities. Let's use Novosibirsk (270) -> Moscow (44)
    // which are known to work in test mode
    
    // 1. Find PVZ in Novosibirsk (sender)
    console.log('=== Searching PVZ in Novosibirsk (code 270) ===');
    const nskPoints = await getDeliveryPoints(config, { city_code: 270 });
    console.log('Total Novosibirsk PVZ: ' + nskPoints.length);
    if (nskPoints.length > 0) {
      console.log('First PVZ: ' + nskPoints[0].code + ' - ' + nskPoints[0].location.address);
    }

    // 2. Find PVZ in Moscow (receiver)
    console.log('\n=== Searching PVZ in Moscow (code 44) ===');
    const moscowPoints = await getDeliveryPoints(config, { city_code: 44 });
    console.log('Total Moscow PVZ: ' + moscowPoints.length);
    if (moscowPoints.length > 0) {
      console.log('First PVZ: ' + moscowPoints[0].code + ' - ' + moscowPoints[0].location.address);
    }

    // 3. Get ALL available tariffs first
    console.log('\n=== Getting all available tariffs Novosibirsk -> Moscow ===');
    console.log('Package: 2 bottles, 4kg, 46x33x23 cm');
    
    const listRequest = {
      from_location: { code: 270 }, // Novosibirsk
      to_location: { code: 44 }, // Moscow
      packages: [{
        weight: 4000, // 4 kg
        length: 46,
        width: 33,
        height: 23
      }]
    };

    const tariffs = await calculateTariffList(config, listRequest);
    console.log('\nAvailable tariffs:');
    if (tariffs.tariff_codes && tariffs.tariff_codes.length > 0) {
      tariffs.tariff_codes.forEach(t => {
        console.log(`  ${t.tariff_code}: ${t.tariff_name} - ${t.delivery_sum} RUB (${t.period_min}-${t.period_max} days)`);
      });
      
      // Use tariff 136 (Posylka sklad-sklad) - the one we need
      const tariff = tariffs.tariff_codes.find(t => t.tariff_code === 136) || tariffs.tariff_codes[0];
      console.log('\n=== Calculating with tariff ' + tariff.tariff_code + ' (' + tariff.tariff_name + ') + Insurance ===');
      
      const request = {
        tariff_code: tariff.tariff_code,
        from_location: { code: 270 },
        to_location: { code: 44 },
        packages: [{
          weight: 4000,
          length: 46,
          width: 33,
          height: 23
        }],
        services: [
          { code: 'INSURANCE', parameter: '2000' },      // Страховка 2000 руб
          { code: 'CARTON_BOX_5KG', parameter: '1' },    // Коробка до 5 кг (внешняя)
          { code: 'CARTON_BOX_3KG', parameter: '1' }     // Коробка до 3 кг (внутренняя)
        ]
      };

      const result = await calculateTariff(config, request);
      console.log('\n============ RESULT ============');
      console.log('Tariff:             ' + tariff.tariff_name);
      console.log('Delivery cost:      ' + result.delivery_sum + ' RUB');
      console.log('--------------------------------');
      console.log('Services breakdown:');
      if (result.services && result.services.length > 0) {
        result.services.forEach(s => {
          console.log('  ' + s.code + ': ' + s.sum + ' RUB');
        });
      } else {
        console.log('  (no services)');
      }
      console.log('--------------------------------');
      console.log('TOTAL:              ' + result.total_sum + ' RUB');
      console.log('Delivery time:      ' + result.period_min + '-' + result.period_max + ' days');
      console.log('Weight (calculated):' + result.weight_calc + ' g');
      console.log('================================');
    } else {
      console.log('No tariffs available!');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
