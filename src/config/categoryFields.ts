// Configuration for dynamic fields based on product category

export interface CategoryField {
  key: string;
  label: string;
  icon: 'zap' | 'box' | 'tag' | 'grid' | 'gauge' | 'battery' | 'ruler' | 'weight' | 'clock' | 'fuel' | 'settings';
  type: 'text' | 'select';
  options?: string[];
  placeholder?: string;
}

export interface CategoryConfig {
  name: string;
  fields: CategoryField[];
  defaultType?: string;
  types?: string[]; // Available product types for this category
}

export const categoryConfigs: Record<string, CategoryConfig> = {
  'Eletrodomésticos': {
    name: 'Eletrodomésticos',
    defaultType: 'Freezer',
    types: ['Freezer', 'Geladeira', 'Ar Condicionado', 'Televisão', 'Máquina de Lavar', 'Fogão', 'Micro-ondas', 'Lava-louças'],
    fields: [
      { key: 'voltage', label: 'Voltagem', icon: 'zap', type: 'select', options: ['110V', '220V', 'Bivolt'] },
    ],
  },
  'Peças e Acessórios Automotivos': {
    name: 'Peças e Acessórios Automotivos',
    defaultType: 'Rodas',
    types: ['Rodas', 'Pneus', 'Faróis', 'Lanternas', 'Escapamento', 'Suspensão', 'Freios', 'Motor', 'Câmbio', 'Acessórios'],
    fields: [
      { key: 'compatibilidade', label: 'Compatibilidade', icon: 'settings', type: 'text', placeholder: 'Ex: VW, Fiat, GM' },
      { key: 'aro', label: 'Aro', icon: 'ruler', type: 'select', options: ['13"', '14"', '15"', '16"', '17"', '18"', '19"', '20"', '21"', '22"'] },
      { key: 'furacoes', label: 'Furação', icon: 'settings', type: 'text', placeholder: 'Ex: 4x100, 5x112' },
    ],
  },
  'Bicicletas Elétricas': {
    name: 'Bicicletas Elétricas',
    defaultType: 'Bicicleta Elétrica',
    types: ['Bicicleta Elétrica', 'Bicicleta Dobrável Elétrica', 'Mountain Bike Elétrica'],
    fields: [
      { key: 'autonomia', label: 'Autonomia', icon: 'battery', type: 'text', placeholder: 'Ex: 40km' },
      { key: 'potencia_motor', label: 'Potência Motor', icon: 'zap', type: 'text', placeholder: 'Ex: 350W' },
      { key: 'velocidade_max', label: 'Velocidade Máx', icon: 'gauge', type: 'text', placeholder: 'Ex: 25km/h' },
      { key: 'peso', label: 'Peso', icon: 'weight', type: 'text', placeholder: 'Ex: 22kg' },
      { key: 'aro', label: 'Aro', icon: 'ruler', type: 'select', options: ['16"', '20"', '24"', '26"', '27.5"', '29"'] },
    ],
  },
  'Scooters': {
    name: 'Scooters',
    defaultType: 'Scooter Elétrica',
    types: ['Scooter Elétrica', 'Patinete Elétrico'],
    fields: [
      { key: 'autonomia', label: 'Autonomia', icon: 'battery', type: 'text', placeholder: 'Ex: 45km' },
      { key: 'potencia_motor', label: 'Potência Motor', icon: 'zap', type: 'text', placeholder: 'Ex: 500W' },
      { key: 'velocidade_max', label: 'Velocidade Máx', icon: 'gauge', type: 'text', placeholder: 'Ex: 35km/h' },
      { key: 'peso', label: 'Peso', icon: 'weight', type: 'text', placeholder: 'Ex: 15kg' },
      { key: 'tempo_carga', label: 'Tempo de Carga', icon: 'clock', type: 'text', placeholder: 'Ex: 4-6 horas' },
    ],
  },
  'Móveis': {
    name: 'Móveis',
    defaultType: 'Móvel',
    types: ['Sofá', 'Mesa', 'Cadeira', 'Guarda-roupa', 'Cama', 'Estante', 'Rack'],
    fields: [
      { key: 'material', label: 'Material', icon: 'box', type: 'text', placeholder: 'Ex: MDF, Madeira' },
      { key: 'dimensoes', label: 'Dimensões', icon: 'ruler', type: 'text', placeholder: 'Ex: 120x60x80cm' },
      { key: 'cor', label: 'Cor', icon: 'tag', type: 'text', placeholder: 'Ex: Branco' },
    ],
  },
  'Eletroportáteis': {
    name: 'Eletroportáteis',
    defaultType: 'Eletroportátil',
    types: ['Aspirador', 'Cafeteira', 'Liquidificador', 'Batedeira', 'Ferro de Passar', 'Ventilador', 'Secador'],
    fields: [
      { key: 'voltage', label: 'Voltagem', icon: 'zap', type: 'select', options: ['110V', '220V', 'Bivolt'] },
      { key: 'potencia', label: 'Potência', icon: 'zap', type: 'text', placeholder: 'Ex: 1200W' },
    ],
  },
  'Videogames': {
    name: 'Videogames',
    defaultType: 'Console',
    types: ['Console', 'Jogos', 'Controles', 'Acessórios'],
    fields: [
      { key: 'armazenamento', label: 'Armazenamento', icon: 'box', type: 'text', placeholder: 'Ex: 500GB' },
      { key: 'acessorios', label: 'Acessórios', icon: 'settings', type: 'text', placeholder: 'Ex: 2 controles' },
    ],
  },
  'Computadores': {
    name: 'Computadores',
    defaultType: 'Computador',
    types: ['Desktop', 'Notebook', 'Monitor', 'Periféricos'],
    fields: [
      { key: 'processador', label: 'Processador', icon: 'settings', type: 'text', placeholder: 'Ex: Intel i7' },
      { key: 'memoria_ram', label: 'Memória RAM', icon: 'box', type: 'text', placeholder: 'Ex: 16GB' },
      { key: 'armazenamento', label: 'Armazenamento', icon: 'box', type: 'text', placeholder: 'Ex: 512GB SSD' },
    ],
  },
  'Celulares': {
    name: 'Celulares',
    defaultType: 'Smartphone',
    types: ['Smartphone', 'Tablet', 'Acessórios'],
    fields: [
      { key: 'memoria_ram', label: 'Memória RAM', icon: 'box', type: 'text', placeholder: 'Ex: 8GB' },
      { key: 'armazenamento', label: 'Armazenamento', icon: 'box', type: 'text', placeholder: 'Ex: 128GB' },
      { key: 'cor', label: 'Cor', icon: 'tag', type: 'text', placeholder: 'Ex: Preto' },
    ],
  },
  'Audio': {
    name: 'Audio',
    defaultType: 'Equipamento de Áudio',
    types: ['Caixa de Som', 'Fone de Ouvido', 'Microfone', 'Home Theater'],
    fields: [
      { key: 'potencia', label: 'Potência', icon: 'zap', type: 'text', placeholder: 'Ex: 100W RMS' },
      { key: 'conectividade', label: 'Conectividade', icon: 'settings', type: 'text', placeholder: 'Ex: Bluetooth 5.0' },
    ],
  },
  'Carros': {
    name: 'Carros',
    defaultType: 'Automóvel',
    types: ['Hatch', 'Sedan', 'SUV', 'Pickup', 'Esportivo'],
    fields: [
      { key: 'ano', label: 'Ano', icon: 'clock', type: 'text', placeholder: 'Ex: 2022' },
      { key: 'km', label: 'Quilometragem', icon: 'gauge', type: 'text', placeholder: 'Ex: 45.000 km' },
      { key: 'combustivel', label: 'Combustível', icon: 'fuel', type: 'select', options: ['Flex', 'Gasolina', 'Álcool', 'Diesel', 'Elétrico', 'Híbrido'] },
      { key: 'cambio', label: 'Câmbio', icon: 'settings', type: 'select', options: ['Manual', 'Automático', 'CVT', 'Automatizado'] },
    ],
  },
  'Apartamentos': {
    name: 'Apartamentos',
    defaultType: 'Imóvel',
    types: ['Apartamento', 'Casa', 'Kitnet', 'Cobertura'],
    fields: [
      { key: 'area', label: 'Área', icon: 'ruler', type: 'text', placeholder: 'Ex: 85m²' },
      { key: 'quartos', label: 'Quartos', icon: 'box', type: 'text', placeholder: 'Ex: 3' },
      { key: 'banheiros', label: 'Banheiros', icon: 'box', type: 'text', placeholder: 'Ex: 2' },
      { key: 'vagas', label: 'Vagas', icon: 'box', type: 'text', placeholder: 'Ex: 1' },
    ],
  },
};

export const categories = Object.keys(categoryConfigs);

export const getCategoryConfig = (category: string): CategoryConfig | null => {
  return categoryConfigs[category] || null;
};

export const getDefaultFields = (): CategoryField[] => {
  return [
    { key: 'voltage', label: 'Voltagem', icon: 'zap', type: 'text', placeholder: 'Ex: 220V' },
  ];
};
