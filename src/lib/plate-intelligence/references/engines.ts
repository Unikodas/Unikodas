import { reference } from './types';

export const ENGINE_REFERENCES = [
  reference('V8', 'V8', 'ENGINE', 88, 'V8 dažnai siejama su galingais sportiniais ar premium automobiliais.', [], ['AMG', 'M5', 'MUSTANG']),
  reference('V10', 'V10', 'ENGINE', 88, 'V10 gali priminti Lamborghini, Audi R8 ar BMW M5 E60 tipo automobilius.', [], ['R8', 'LAMBORGHINI', 'M5']),
  reference('V12', 'V12', 'ENGINE', 90, 'V12 dažnai siejama su superautomobiliais ir prabangiais flagmanais.', [], ['FERRARI', 'LAMBORGHINI', 'S65']),
  reference('W16', 'W16', 'ENGINE', 92, 'W16 labai siejama su Bugatti Veyron ir Chiron.', [], ['BUGATTI', 'CHIRON']),
  reference('2JZ', '2JZ', 'ENGINE', 94, '2JZ yra vienas žinomiausių Toyota Supra ir JDM variklių kodų.', [], ['SUPRA', 'JDM']),
  reference('1JZ', '1JZ', 'ENGINE', 88, '1JZ taip pat pažįstamas Toyota ir JDM tiuningo aplinkoje.', [], ['SUPRA', '2JZ']),
  reference('RB26', 'RB26', 'ENGINE', 92, 'RB26 labai siejama su Nissan Skyline GT-R.', [], ['GTR', 'SKYLINE']),
  reference('SR20', 'SR20', 'ENGINE', 86, 'SR20 pažįstamas Nissan Silvia ir JDM entuziastams.', [], ['SILVIA', 'JDM']),
  reference('VR38', 'VR38', 'ENGINE', 86, 'VR38 gali priminti modernų Nissan GT-R variklį.', [], ['GTR', 'NISMO']),
  reference('4G63', '4G63', 'ENGINE', 90, '4G63 labai siejama su Mitsubishi Lancer Evolution.', [], ['EVO', 'LANCER']),
  reference('EJ20', 'EJ20', 'ENGINE', 84, 'EJ20 gali priminti Subaru WRX/STI bokserio variklį.', [], ['WRX', 'STI']),
  reference('EJ25', 'EJ25', 'ENGINE', 82, 'EJ25 gali priminti Subaru WRX/STI bokserio variklį.', [], ['WRX', 'STI']),
  reference('K20', 'K20', 'ENGINE', 84, 'K20 dažnai pažįstamas Honda Type R ir K serijos entuziastams.', [], ['TYPER', 'CIVIC']),
  reference('K24', 'K24', 'ENGINE', 82, 'K24 gali priminti Honda K serijos variklį.', [], ['K20', 'TYPER']),
] as const;

