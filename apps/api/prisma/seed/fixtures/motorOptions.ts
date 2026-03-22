import { Prisma } from '@prisma/client';

// [SAMPLE] Motor options spanning the power range of sample pump sizes.
export const sampleMotorOptions: Prisma.MotorOptionCreateInput[] = [
  // 7.5kW 4-pole 1450rpm TEFC
  { manufacturer: '[SAMPLE] Motors Inc', modelNumber: 'SM-7.5-4P-TEFC', powerKw: 7.5, powerHp: 10, speedRpm: 1450, poles: 4, voltage: '460V', phase: 3, frequencyHz: 60, enclosure: 'TEFC', frame: '213T', efficiencyClass: 'IE3', fullLoadEfficiency: 91.7, serviceFactor: 1.15, isInverterDuty: false, domesticManufactured: true },
  // 7.5kW 2-pole 2900rpm TEFC
  { manufacturer: '[SAMPLE] Motors Inc', modelNumber: 'SM-7.5-2P-TEFC', powerKw: 7.5, powerHp: 10, speedRpm: 2900, poles: 2, voltage: '460V', phase: 3, frequencyHz: 60, enclosure: 'TEFC', frame: '213T', efficiencyClass: 'IE3', fullLoadEfficiency: 91.0, serviceFactor: 1.15, isInverterDuty: false, domesticManufactured: true },
  // 15kW 4-pole TEFC
  { manufacturer: '[SAMPLE] Motors Inc', modelNumber: 'SM-15-4P-TEFC', powerKw: 15, powerHp: 20, speedRpm: 1450, poles: 4, voltage: '460V', phase: 3, frequencyHz: 60, enclosure: 'TEFC', frame: '254T', efficiencyClass: 'IE3', fullLoadEfficiency: 93.0, serviceFactor: 1.15, isInverterDuty: false, domesticManufactured: true, fmApproved: true, ulListed: true },
  // 15kW 4-pole VFD-rated
  { manufacturer: '[SAMPLE] Motors Inc', modelNumber: 'SM-15-4P-VFD', powerKw: 15, powerHp: 20, speedRpm: 1450, poles: 4, voltage: '460V', phase: 3, frequencyHz: 60, enclosure: 'TEFC', frame: '254T', efficiencyClass: 'IE3', fullLoadEfficiency: 93.0, serviceFactor: 1.0, isInverterDuty: true, domesticManufactured: true },
  // 30kW 4-pole TEFC
  { manufacturer: '[SAMPLE] Motors Inc', modelNumber: 'SM-30-4P-TEFC', powerKw: 30, powerHp: 40, speedRpm: 1450, poles: 4, voltage: '460V', phase: 3, frequencyHz: 60, enclosure: 'TEFC', frame: '286T', efficiencyClass: 'IE3', fullLoadEfficiency: 94.1, serviceFactor: 1.15, isInverterDuty: false, domesticManufactured: true, fmApproved: true, ulListed: true },
  // 30kW 2-pole TEFC
  { manufacturer: '[SAMPLE] Motors Inc', modelNumber: 'SM-30-2P-TEFC', powerKw: 30, powerHp: 40, speedRpm: 2900, poles: 2, voltage: '460V', phase: 3, frequencyHz: 60, enclosure: 'TEFC', frame: '286T', efficiencyClass: 'IE3', fullLoadEfficiency: 93.6, serviceFactor: 1.15, isInverterDuty: false, domesticManufactured: true },
  // 55kW 4-pole TEFC
  { manufacturer: '[SAMPLE] Motors Inc', modelNumber: 'SM-55-4P-TEFC', powerKw: 55, powerHp: 75, speedRpm: 1450, poles: 4, voltage: '460V', phase: 3, frequencyHz: 60, enclosure: 'TEFC', frame: '326T', efficiencyClass: 'IE3', fullLoadEfficiency: 95.0, serviceFactor: 1.15, isInverterDuty: false, domesticManufactured: true, fmApproved: true, ulListed: true },
  // 55kW XP (explosion-proof)
  { manufacturer: '[SAMPLE] Motors Inc', modelNumber: 'SM-55-4P-XP', powerKw: 55, powerHp: 75, speedRpm: 1450, poles: 4, voltage: '460V', phase: 3, frequencyHz: 60, enclosure: 'XP', frame: '326T', efficiencyClass: 'IE3', fullLoadEfficiency: 94.5, serviceFactor: 1.0, isInverterDuty: false, hazardousClass: 'Class I Div 1', domesticManufactured: true },
  // 75kW 4-pole TEFC (for larger pumps)
  { manufacturer: '[SAMPLE] Motors Inc', modelNumber: 'SM-75-4P-TEFC', powerKw: 75, powerHp: 100, speedRpm: 1450, poles: 4, voltage: '460V', phase: 3, frequencyHz: 60, enclosure: 'TEFC', frame: '365T', efficiencyClass: 'IE3', fullLoadEfficiency: 95.4, serviceFactor: 1.15, isInverterDuty: false, domesticManufactured: true, fmApproved: true, ulListed: true },
  // 15kW non-domestic (for BABA testing)
  { manufacturer: '[SAMPLE] Import Motors', modelNumber: 'IM-15-4P-TEFC', powerKw: 15, powerHp: 20, speedRpm: 1450, poles: 4, voltage: '460V', phase: 3, frequencyHz: 60, enclosure: 'TEFC', frame: '254T', efficiencyClass: 'IE2', fullLoadEfficiency: 91.0, serviceFactor: 1.15, isInverterDuty: false, domesticManufactured: false },
];

export const sampleBaseplateOptions: Prisma.BaseplateOptionCreateInput[] = [
  { type: 'fabricated_steel', material: 'Carbon Steel', applicableHiTypes: ['OH1', 'OH2', 'BB1', 'BB2'], hasDripRim: true, hasDrain: true, groutType: 'epoxy', domesticManufactured: true, description: 'Standard fabricated steel baseplate with drip rim and drain' },
  { type: 'cast_iron', material: 'Gray Cast Iron', applicableHiTypes: ['OH1', 'OH2'], hasDripRim: false, hasDrain: false, groutType: 'cementitious', domesticManufactured: true, description: 'Cast iron baseplate for small OH pumps' },
  { type: 'ss_fabricated', material: '316 Stainless Steel', applicableHiTypes: ['OH1', 'OH2', 'BB1', 'BB2'], hasDripRim: true, hasDrain: true, groutType: 'epoxy', domesticManufactured: true, description: 'Stainless steel baseplate for corrosive environments' },
  { type: 'spring_mounted', material: 'Carbon Steel', applicableHiTypes: ['OH1', 'OH2', 'BB1'], hasDripRim: true, hasDrain: true, groutType: 'none', domesticManufactured: false, description: 'Spring-isolated baseplate for vibration-sensitive installations' },
  { type: 'soleplate', material: 'Carbon Steel', applicableHiTypes: ['BB1', 'BB2', 'BB3', 'BB5'], hasDripRim: false, hasDrain: false, groutType: 'epoxy', domesticManufactured: true, description: 'Soleplate for large between-bearings pumps' },
];
