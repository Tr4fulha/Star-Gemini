
import { Language } from '../types';

export const TRANSLATIONS: Record<Language, any> = {
  pt: {
    launch: "INICIAR",
    shop: "LOJA",
    rank: "RANK",
    opts: "OPTS",
    info: "INFO",
    pilot_id: "ID DO PILOTO",
    credits: "CRÉDITOS",
    high_score: "RECORDE",
    armory: "ARMÁRIA",
    upgrade_systems: "SISTEMAS DE UPGRADE",
    installed: "INSTALADO",
    return_menu: "VOLTAR AO MENU",
    select_craft: "SELECIONAR NAVE",
    initiate_launch: "INICIAR LANÇAMENTO",
    locked: "BLOQUEADO",
    mission_failed: "FALHA NA MISSÃO",
    retry: "TENTAR NOVAMENTE",
    menu: "MENU",
    language: "IDIOMA",
    vol_master: "VOLUME GERAL",
    vol_music: "MÚSICA",
    vol_sfx: "EFEITOS (SFX)",
    back: "VOLTAR",
    changelog_title: "REGISTROS DE BORDO",
    understand: "ENTENDIDO",
    hall_of_fame: "MURAL DA FAMA",
    ultra_ready: "ULTRA PRONTO",
    enemy_sector: "SETOR INIMIGO",
    pilot_sector: "SETOR DO PILOTO",
    wave: "ONDA",
    combo: "COMBO",
    fullscreen: "TELA CHEIA / PAISAGEM",
    boss_warning: "AVISO: ENTIDADE DESCONHECIDA DETECTADA",
    boss_defeated: "BOSS ELIMINADO",
    scrap_collected: "SUCATA COLETADA",
    hud_editor: "INTERFACE TÁTICA",
    configure_hud: "CONFIGURAR HUD",
    save_layout: "SALVAR LAYOUT",
    reset_layout: "RESETAR",
    hud_opacity: "OPACIDADE GERAL",
    hud_scale: "ESCALA GERAL",
    left_handed: "MODO CANHOTO",
    quit: "SAIR DA MISSÃO",
    pause: "PAUSA TÁTICA",
    continue: "CONTINUAR",
    
    // Novo
    enter_name_title: "BEM-VINDO PILOTO",
    enter_name_sub: "INSIRA SUA IDENTIFICAÇÃO",
    confirm_pilot: "CONFIRMAR",
    replay_tutorial: "REVER TUTORIAL",

    // Tutorial
    tutorial: {
        welcome_title: "BEM-VINDO PILOTO",
        welcome_text: "Sistemas inicializando. Antes de enviá-lo para o vazio, precisamos calibrar seus sistemas de navegação e combate.",
        start_cal: "INICIAR CALIBRAÇÃO",
        nav_title: "NAVEGAÇÃO",
        move_msg: "MOVA-SE PARA CONTINUAR",
        pc_move: "WASD / SETAS",
        mob_move: "ARRASTE NO LADO ESQUERDO",
        wep_title: "ARMAS",
        fire_msg: "ATIRE PARA CONTINUAR",
        pc_fire: "ESPAÇO (AUTO)",
        mob_fire: "TOQUE NO LADO DIREITO",
        ready_btn: "ESTOU PRONTO",
        skip: "PULAR TUTORIAL",
        objs: {
            scrap_title: "COLETAR SUCATA",
            scrap_desc: "Destrua inimigos para obter Sucata. Use na Loja para upgrades.",
            ult_title: "PODER SUPREMO",
            ult_desc: "Mate inimigos para carregar Energia. Use o botão ULTRA para limpar a tela.",
            surv_title: "SOBREVIVA",
            surv_desc: "Inimigos ficam mais fortes a cada onda. Chefes aparecem a cada 5 ondas."
        }
    },

    // Categorias de Opções
    cat_audio: "ÁUDIO",
    cat_lang: "IDIOMA",
    cat_ctrl: "CONTROLES",

    // Categorias da Loja
    shop_cats: {
        equipment: "EQUIPAMENTOS",
        cards: "CARTAS / MÓDULOS",
        tech_tree: "ÁRVORE TECH",
        soon: "BREVEMENTE"
    },
    tech_tree_locked: "SISTEMA EM DESENVOLVIMENTO",

    sectors: {
        void: "ESPAÇO PROFUNDO",
        nebula: "NEBULA DE GÁS",
        asteroid_belt: "CINTURÃO DE ASTEROIDES",
        solar_storm: "TEMPESTADE SOLAR"
    },
    warnings: {
        solar_flare: "ALERTA DE ALTA TEMPERATURA! BUSQUE PROTEÇÃO!",
        frozen: "SISTEMAS CONGELADOS",
        burning: "CASCO EM CHAMAS"
    },

    modules_title: "MÓDULOS TÁTICOS",
    slots: "SLOTS",
    mastery: "MAESTRIA",
    level: "NÍVEL",
    equip: "EQUIPAR",
    unequip: "REMOVER",
    buy: "COMPRAR",
    owned: "POSSUÍDO",
    empty_slot: "VAZIO",
    
    // Detalhes da Loja
    item_details: "DETALHES TÉCNICOS",
    cost: "CUSTO",

    ships: {
        core: { desc: "Nave de combate equilibrada.", mastery: "+10% Taxa de Disparo (Nvl 5)" },
        phantom: { desc: "Alta velocidade, baixa defesa.", mastery: "+2s Invisibilidade (Nvl 5)" },
        striker: { desc: "Poder de fogo pesado, lenta.", mastery: "+20% Dano Crítico (Nvl 5)" }
    },
    
    // Traduções que faltavam
    upgrades: {
        reinforced_hull: { 
            name: "CASCO REFORÇADO", 
            desc: "Aumenta a integridade estrutural da nave. Adiciona +1 Coração permanente ao iniciar qualquer missão." 
        },
        weapon_preheat: { 
            name: "PRÉ-AQUECIMENTO DE ARMAS", 
            desc: "Mantém os canhões de plasma aquecidos. Aumenta o dano base dos projéteis em 15%." 
        },
        gravity_well: { 
            name: "POÇO GRAVITACIONAL", 
            desc: "Gera um pequeno campo gravitacional que atrai sucata próxima. Aumenta o raio de coleta em 30%." 
        },
        thruster_coolant: { 
            name: "REFRIGERADOR DE PROPULSÃO", 
            desc: "Melhora a eficiência dos motores, permitindo manobras mais ágeis. Aumenta a velocidade de movimento em 10%." 
        },
        data_mining: { 
            name: "MINERAÇÃO DE DADOS", 
            desc: "Algoritmos otimizados para extrair valor de destroços. Aumenta a quantidade de sucata obtida em 20%." 
        }
    },
    
    modules: {
        vampiric: { 
            name: "MUNIÇÃO VAMPÍRICA", 
            desc: "Nanobots experimentais que sifonam energia residual de inimigos destruidos para reparar a integridade do casco. Recupera 1 HP a cada 50 abates confirmados." 
        },
        berzerk: { 
            name: "MOTOR BERSERK", 
            desc: "Sobrecarga os sistemas de armas desviando energia do suporte de vida. O dano aumenta drasticamente conforme a integridade do casco diminui." 
        },
        magnet: { 
            name: "AUTO-ÍMÃ GRAVITON", 
            desc: "Gerador de campo eletromagnético de alta potência. Atrai sucata de todo o setor automaticamente, mas o peso energético reduz a velocidade dos propulsores em 15%." 
        }
    },

    powerups: {
      health: "REPARO",
      triple_shot: "TIRO TRIPLO",
      rapid_fire: "CADÊNCIA",
      shield: "ESCUDO",
      battery: "BATERIA",
      nuke: "NUCLEAR",
      damage: "DANO+"
    },
    changelog: [
      { version: '2.0.1', changes: [
          'SISTEMA: Novo fluxo de boas-vindas (Nome -> Tutorial -> Jogo).',
          'INTERFACE: Adicionada tela de Registro de Piloto.',
          'OPÇÕES: Adicionado botão "Rever Tutorial".',
          'CORREÇÃO: Leaderboard Global e Daily Ops agora carregam corretamente.',
          'TRADUÇÃO: Textos do Mural da Fama e Tutorial localizados.',
          'DATABASE: Otimização na sincronização de progresso e correções de segurança (RLS).'
      ]},
      { version: '1.9.9', changes: [
          'REFACTOR: Sistema de Spawner extraído para melhor performance.',
          'DAILY OPS: Garantia de RNG determinístico para justiça competitiva.',
          'Código da GameEngine otimizado.'
      ]},
      { version: '1.9.8', changes: [
          'NOVO MODO: Daily Ops (Desafio Diário).',
          'Leaderboard separado para o Daily Ops.',
          'Nova Moeda (em breve): Dark Matter.'
      ]}
    ]
  },
  en: {
    launch: "LAUNCH",
    shop: "SHOP",
    rank: "RANK",
    opts: "OPTS",
    info: "INFO",
    pilot_id: "PILOT ID",
    credits: "CREDITS",
    high_score: "HIGH SCORE",
    armory: "ARMORY",
    upgrade_systems: "UPGRADE SYSTEMS",
    installed: "INSTALLED",
    return_menu: "RETURN TO MENU",
    select_craft: "SELECT CRAFT",
    initiate_launch: "INITIATE LAUNCH",
    locked: "LOCKED",
    mission_failed: "MISSION FAILED",
    retry: "RETRY",
    menu: "MENU",
    language: "LANGUAGE",
    vol_master: "MASTER VOLUME",
    vol_music: "MUSIC",
    vol_sfx: "EFFECTS (SFX)",
    back: "BACK",
    changelog_title: "LOG RECORDS",
    understand: "UNDERSTOOD",
    hall_of_fame: "WALL OF FAME",
    ultra_ready: "ULTRA READY",
    enemy_sector: "ENEMY SECTOR",
    pilot_sector: "PILOT SECTOR",
    wave: "WAVE",
    combo: "COMBO",
    fullscreen: "FULLSCREEN / LANDSCAPE",
    boss_warning: "WARNING: UNKNOWN ENTITY DETECTED",
    boss_defeated: "BOSS ELIMINATED",
    scrap_collected: "SCRAP COLLECTED",
    hud_editor: "TACTICIAN INTERFACE",
    configure_hud: "CONFIGURE HUD",
    save_layout: "SAVE LAYOUT",
    reset_layout: "RESET",
    hud_opacity: "GLOBAL OPACITY",
    hud_scale: "GLOBAL SCALE",
    left_handed: "LEFT HANDED",
    quit: "ABORT MISSION",
    pause: "TACTICAL PAUSE",
    continue: "RESUME",

    // Novo
    enter_name_title: "WELCOME PILOT",
    enter_name_sub: "ENTER IDENTIFICATION",
    confirm_pilot: "CONFIRM",
    replay_tutorial: "REPLAY TUTORIAL",

    // Tutorial
    tutorial: {
        welcome_title: "WELCOME PILOT",
        welcome_text: "Systems initializing. Before we send you to the void, we need to calibrate your navigation and weapon systems.",
        start_cal: "START CALIBRATION",
        nav_title: "NAVIGATION",
        move_msg: "MOVE TO CONTINUE",
        pc_move: "WASD / ARROWS",
        mob_move: "DRAG LEFT SIDE",
        wep_title: "WEAPONS",
        fire_msg: "FIRE TO CONTINUE",
        pc_fire: "SPACEBAR (AUTO)",
        mob_fire: "TAP RIGHT SIDE",
        ready_btn: "I AM READY",
        skip: "SKIP TUTORIAL",
        objs: {
            scrap_title: "COLLECT SCRAP",
            scrap_desc: "Destroy enemies to drop Scrap. Use it in the Shop to buy upgrades.",
            ult_title: "ULTIMATE POWER",
            ult_desc: "Kill enemies to charge Energy. Use the ULTRA button to clear the screen.",
            surv_title: "SURVIVE",
            surv_desc: "Enemies get stronger every wave. Bosses appear every 5 waves."
        }
    },

    cat_audio: "AUDIO",
    cat_lang: "LANGUAGE",
    cat_ctrl: "CONTROLES",

    shop_cats: {
        equipment: "EQUIPMENT",
        cards: "CARDS / MODULES",
        tech_tree: "TECH TREE",
        soon: "COMING SOON"
    },
    tech_tree_locked: "SYSTEM UNDER DEVELOPMENT",

    sectors: {
        void: "DEEP SPACE VOID",
        nebula: "GAS NEBULA",
        asteroid_belt: "ASTEROID BELT",
        solar_storm: "SOLAR STORM"
    },
    warnings: {
        solar_flare: "HIGH TEMP DETECTED! SEEK COVER!",
        frozen: "SYSTEMS FROZEN",
        burning: "HULL CRITICAL"
    },
    
    modules_title: "TACTICAL MODULES",
    slots: "SLOTS",
    mastery: "MASTERY",
    level: "LEVEL",
    equip: "EQUIP",
    unequip: "UNEQUIP",
    buy: "BUY",
    owned: "OWNED",
    empty_slot: "EMPTY",

    item_details: "TECHNICAL DETAILS",
    cost: "COST",

    ships: {
        core: { desc: "Balanced combat vessel.", mastery: "+10% Fire Rate (Lvl 5)" },
        phantom: { desc: "High speed, low defense.", mastery: "+2s Stealth Duration (Lvl 5)" },
        striker: { desc: "Heavy firepower, slow.", mastery: "+20% Crit Damage (Lvl 5)" }
    },
    
    // Missing translations added
    upgrades: {
        reinforced_hull: { 
            name: "REINFORCED HULL", 
            desc: "Increases the ship's structural integrity. Adds +1 Permanent Heart when starting any mission." 
        },
        weapon_preheat: { 
            name: "WEAPON PREHEAT", 
            desc: "Keeps plasma cannons warm and ready. Increases base projectile damage by 15%." 
        },
        gravity_well: { 
            name: "GRAVITY WELL", 
            desc: "Generates a small gravitational field that pulls in nearby scrap. Increases collection radius by 30%." 
        },
        thruster_coolant: { 
            name: "THRUSTER COOLANT", 
            desc: "Improves engine efficiency, allowing for sharper maneuvers. Increases movement speed by 10%." 
        },
        data_mining: { 
            name: "DATA MINING", 
            desc: "Optimized algorithms to extract value from debris. Increases scrap collected amount by 20%." 
        }
    },

    modules: {
        vampiric: { 
            name: "VAMPIRIC ROUNDS", 
            desc: "Experimental nanobots that siphon residual energy from destroyed enemies to repair hull integrity. Recovers 1 HP every 50 confirmed kills." 
        },
        berzerk: { 
            name: "BERSERK DRIVE", 
            desc: "Overclocks weapon systems by diverting power from life support. Damage output increases drastically as hull integrity decreases." 
        },
        magnet: { 
            name: "GRAVITON AUTO-MAGNET", 
            desc: "High-power electromagnetic field generator. Automatically attracts scrap from the entire sector, but the energy weight reduces thruster speed by 15%." 
        }
    },

    powerups: {
      health: "REPAIR",
      triple_shot: "TRIPLE SHOT",
      rapid_fire: "RAPID FIRE",
      shield: "SHIELD",
      battery: "BATTERY",
      nuke: "NUKE",
      damage: "DAMAGE+"
    },
    changelog: [
      { version: '2.0.1', changes: [
          'SYSTEM: New welcome flow (Name -> Tutorial -> Game).',
          'UI: Added Pilot Registration screen.',
          'OPTIONS: Added "Replay Tutorial" button.',
          'FIX: Global Leaderboard and Daily Ops loading issues resolved.',
          'LOCALIZATION: Fixed Wall of Fame and Tutorial translations.',
          'DATABASE: Optimized progress synchronization and security fixes (RLS).'
      ]},
      { version: '1.9.9', changes: [
          'REFACTOR: Extracted Spawner System for better performance.',
          'DAILY OPS: Ensured deterministic RNG for competitive fairness.',
          'GameEngine code optimized.'
      ]},
      { version: '1.9.8', changes: [
          'NEW MODE: Daily Ops.',
          'Separate Leaderboard for Daily Ops.',
          'New Currency (coming soon): Dark Matter.'
      ]}
    ]
  },
  es: {
    launch: "INICIAR",
    shop: "TIENDA",
    rank: "RANK",
    opts: "OPTS",
    info: "INFO",
    pilot_id: "ID DEL PILOTO",
    credits: "CRÉDITOS",
    high_score: "RÉCORD",
    armory: "ARMERÍA",
    upgrade_systems: "SISTEMAS DE MEJORA",
    installed: "INSTALADO",
    return_menu: "VOLVER AL MENÚ",
    select_craft: "SELECIONAR NAVE",
    initiate_launch: "INICIAR LANZAMIENTO",
    locked: "BLOQUEADO",
    mission_failed: "MISIÓN FALLIDA",
    retry: "REINTENTAR",
    menu: "MENÚ",
    language: "IDIOMA",
    vol_master: "VOLUMEN MAESTRO",
    vol_music: "MÚSICA",
    vol_sfx: "EFECTOS (SFX)",
    back: "VOLVER",
    changelog_title: "REGISTROS",
    understand: "ENTENDIDO",
    hall_of_fame: "MURO DE LA FAMA",
    ultra_ready: "ULTRA LISTO",
    enemy_sector: "SECTOR ENEMIGO",
    pilot_sector: "SECTOR DEL PILOTO",
    wave: "OLA",
    combo: "COMBO",
    fullscreen: "PANTALLA COMPLETA / HORIZONTAL",
    boss_warning: "AVISO: ENTIDAD DESCONOCIDA DETECTADA",
    boss_defeated: "BOSS ELIMINADO",
    scrap_collected: "CHATARRA RECOLECTADA",
    hud_editor: "INTERFAZ TÁCTICA",
    configure_hud: "CONFIGURAR HUD",
    save_layout: "GUARDAR",
    reset_layout: "REINICIAR",
    hud_opacity: "OPACIDAD GLOBAL",
    hud_scale: "ESCALA GLOBAL",
    left_handed: "MODO ZURDO",
    quit: "ABORTAR MISIÓN",
    pause: "PAUSA TÁCTICA",
    continue: "CONTINUAR",
    
    // Novo
    enter_name_title: "BIENVENIDO PILOTO",
    enter_name_sub: "INGRESE SU IDENTIFICACIÓN",
    confirm_pilot: "CONFIRMAR",
    replay_tutorial: "REPETIR TUTORIAL",

    // Tutorial
    tutorial: {
        welcome_title: "BIENVENIDO PILOTO",
        welcome_text: "Sistemas iniciando. Antes de enviarlo al vacío, necesitamos calibrar sus sistemas de navegación y combate.",
        start_cal: "INICIAR CALIBRACIÓN",
        nav_title: "NAVEGACIÓN",
        move_msg: "MOVER PARA CONTINUAR",
        pc_move: "WASD / FLECHAS",
        mob_move: "ARRASTRE LADO IZQUIERDO",
        wep_title: "ARMAS",
        fire_msg: "DISPARAR PARA CONTINUAR",
        pc_fire: "ESPACIO (AUTO)",
        mob_fire: "TOQUE LADO DERECHO",
        ready_btn: "ESTOY LISTO",
        skip: "SALTAR TUTORIAL",
        objs: {
            scrap_title: "RECOLECTAR CHATARRA",
            scrap_desc: "Destruye enemigos para obtener Chatarra. Úsala en la Tienda para mejoras.",
            ult_title: "PODER SUPREMO",
            ult_desc: "Mata enemigos para cargar Energía. Usa el botón ULTRA para limpiar la pantalla.",
            surv_title: "SOBREVIVIR",
            surv_desc: "Los enemigos se vuelven más fuertes. Los jefes aparecen cada 5 oleadas."
        }
    },

    cat_audio: "AUDIO",
    cat_lang: "IDIOMA",
    cat_ctrl: "CONTROLES",

    shop_cats: {
        equipment: "EQUIPAMIENTO",
        cards: "CARTAS / MÓDULOS",
        tech_tree: "ÁRBOL TECH",
        soon: "PRÓXIMAMENTE"
    },
    tech_tree_locked: "SISTEMA EN DESARROLLO",

    sectors: {
        void: "VACÍO ESPACIAL",
        nebula: "NEBULA DE GÁS",
        asteroid_belt: "CINTURÓN DE ASTEROIDES",
        solar_storm: "TORMENTA SOLAR"
    },
    warnings: {
        solar_flare: "¡ALERTA DE CALOR! ¡BUSCA COBERTURA!",
        frozen: "SISTEMAS CONGELADOS",
        burning: "CASCO ARDIENDO"
    },

    modules_title: "MÓDULOS TÁTICOS",
    slots: "RANURAS",
    mastery: "MAESTRÍA",
    level: "NIVEL",
    equip: "EQUIPAR",
    unequip: "QUITAR",
    buy: "COMPRAR",
    owned: "ADQUIRIDO",
    empty_slot: "VACÍO",
    
    item_details: "DETALLES TÉCNICOS",
    cost: "COSTO",

    ships: {
        core: { desc: "Nave de combate equilibrada.", mastery: "+10% Cadencia (Nvl 5)" },
        phantom: { desc: "Alta velocidade, baja defesa.", mastery: "+2s Invisibilidade (Nvl 5)" },
        striker: { desc: "Alto poder, lenta.", mastery: "+20% Daño Crítico (Nvl 5)" }
    },
    
    // Traducciones
    upgrades: {
        reinforced_hull: { 
            name: "CASCO REFORZADO", 
            desc: "Aumenta la integridad estructural. Agrega +1 Corazón permanente al iniciar." 
        },
        weapon_preheat: { 
            name: "PRECALENTADO DE ARMAS", 
            desc: "Mantiene los cañones de plasma listos. Aumenta el daño base en un 15%." 
        },
        gravity_well: { 
            name: "POZO GRAVITATORIO", 
            desc: "Genera un campo gravitacional que atrae chatarra. Aumenta el radio de recolección en un 30%." 
        },
        thruster_coolant: { 
            name: "REFRIGERANTE DE MOTOR", 
            desc: "Mejora la eficiencia del motor, permitiendo maniobras más rápidas. +10% de Velocidad." 
        },
        data_mining: { 
            name: "MINERÍA DE DATOS", 
            desc: "Algoritmos optimizados para extraer valor de escombros. Aumenta la chatarra obtenida en un 20%." 
        }
    },

    modules: {
        vampiric: { 
            name: "MUNICIÓN VAMPÍRICA", 
            desc: "Nanobots experimentais que sifonan energía residual de enemigos destruidos para reparar el casco. Recupera 1 HP cada 50 bajas confirmadas." 
        },
        berzerk: { 
            name: "MOTOR BERSERK", 
            desc: "Sobrecarga los sistemas de armas desviando energía del soporte vital. El daño aumenta drásticamente a medida que disminuye la integridad del casco." 
        },
        magnet: { 
            name: "AUTO-IMÁN GRAVITÓN", 
            desc: "Generador de campo electromagnético de alta potencia. Atrae chatarra de todo el sector automáticamente, pero el peso energético reduce la velocidad en un 15%." 
        }
    },

    powerups: {
      health: "REPARAR",
      triple_shot: "TIRO TRIPLE",
      rapid_fire: "CADENCIA",
      shield: "ESCUDO",
      battery: "BATERÍA",
      nuke: "NUCLEAR",
      damage: "DAÑO+"
    },
    changelog: [
      { version: '2.0.1', changes: [
          'SISTEMA: Nuevo flujo de bienvenida (Nombre -> Tutorial -> Juego).',
          'INTERFAZ: Nueva pantalla de Registro de Piloto.',
          'OPCIONES: Botón "Repetir Tutorial" añadido.',
          'CORRECCIÓN: Solucionados problemas de carga del Ranking Global y Daily Ops.',
          'TRADUCCIÓN: Textos del Muro de la Fama y Tutorial localizados.',
          'BASE DE DATOS: Sincronización de progreso optimizada y correcciones de seguridad.'
      ]},
      { version: '1.9.9', changes: [
          'REFACTOR: Sistema de Spawner extraído para mejor rendimiento.',
          'DAILY OPS: RNG determinístico garantizado.',
          'Código GameEngine optimizado.'
      ]},
      { version: '1.9.8', changes: [
          'NUEVO MODO: Daily Ops.',
          'Leaderboard separado.',
          'Nueva Moneda (pronto): Dark Matter.'
      ]}
    ]
  }
};
