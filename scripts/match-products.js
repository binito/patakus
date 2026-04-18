// Análise de correspondência: produtos do site vs produtos na DB
// Não faz alterações - apenas mostra resultados

const mysql = require('mysql2/promise');

const SITE_PRODUCTS = [
  // Página 1
  { name: 'Abrilhantador automático para fornos', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/pro_shine_degras_oven_shine_abrilhantador_automatico_proder-300x300.webp' },
  { name: 'Abrilhantador lava-louça', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/for_shine_abrilhantador_lava_loica_fortex-300x300.webp' },
  { name: 'Abrilhantador para Máquina Lava-Louças Shine 20', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/pro_shine_20_abrilhantador_para_maquina_lava_loucas_proder-300x300.webp' },
  { name: 'Abrilhantador perfumado Flyst Mobel', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/05/flyst-mobel-300x300.webp' },
  { name: 'Aditivo concentrado desengordurante', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Aditivo_concentrado_desengordurante_proder-300x300.webp' },
  { name: 'Aditivo Oxidante Clorado Líquido', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/OXCLORL-300x300.webp' },
  { name: 'Aditivo para Lavandaria ProAd', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/PROAD-300x300.webp' },
  { name: 'Amaciador Concentrado Passador de Roupas', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Amaciante_concentrado_passador_de_roupas_automatico_proder-300x300.webp' },
  { name: 'Deo Due Morbido Ammorbidente', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/morbido-ammorbidente1-300x300.jpg' },
  { name: 'Amaciador para a Roupa Concentrado Solim Soft Talco', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/solim_soft_talco_amaciador_YS-300x300.webp' },
  { name: 'Amaciador para a Roupa Ecológico ProSoft', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/detergente_enzimatico_patakus_caixa-300x300.webp' },
  { name: 'Amaciador para a Roupa SOLIM', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/solim_amaciador_azul_ys-300x300.webp' },
  { name: 'Amaciador Têxtil Concentrado Perfumado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/SOFTBLANC-300x300.webp' },
  { name: 'Ambientador Ambi C.K.O.', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/05/AMBICKO-300x300.webp' },
  { name: 'Ambientador Bifásico DeoDue', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Ambientador-Bifasico-ozonato-300x300.jpg' },
  { name: 'Ambientador concentrado Ambi Olor', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/05/ambi-olor-300x300.webp' },
  // Página 2
  { name: 'Anti-Bolor', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/anti_bolor_ys-300x300.webp' },
  { name: 'Balde preto com escorredor', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/BaldePretocomEscorredor-300x300.webp' },
  { name: 'Best Pav – Limpador de pisos', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/best-pav-300x300.jpg' },
  { name: 'Bobine rolo industrial', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/rolo-industrial-300x300.jpg' },
  { name: 'Cabo anodizado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Caboanodizado-300x300.webp' },
  { name: 'Cabo de alumínio', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Cabodealuminio-300x300.webp' },
  { name: 'Cabo plastificado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Cabo_plastificado_newmop-300x300.webp' },
  { name: 'Capa de vassoura 100% microfibra', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Capadevassoura100_microfibra-300x300.webp' },
  { name: 'Cristais perfumados para aspiradores', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Cristais-Perfumados-para-Aspiradores-ozonato-floral-300x300.jpg' },
  { name: 'Desengordurante alcalino industrial', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/degrasol_lx_ys-300x300.webp' },
  { name: 'Desengordurante automático para fornos', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/pro_wash_degras_oven_clean_limpador_desengordurante_automatico_para_formos_proder-300x300.webp' },
  { name: 'Desengordurante concentrado para lavagem de veículos', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/truck_dp_ys-300x300.webp' },
  { name: 'Desengordurante concentrado profissional', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/degrass_universal_ys-300x300.webp' },
  { name: 'Desengordurante e desoxidante de aluminios e jantes', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Truck-als_patakus-300x300.webp' },
  { name: 'Desengordurante industrial de alta performance', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/proclean_degras_super_desengordurante_concentrado_proder-300x300.webp' },
  { name: 'Desengordurante multiuso concentrado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/multi_degrass_forte_desengordurante_YS-300x300.webp' },
  // Página 3
  { name: 'Desengordurante multiusos', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/desengordurante_multiusos_mdf_YS-300x300.webp' },
  { name: 'Desengordurante perfumado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/profumatore-sgrassatore-300x300.jpg' },
  { name: 'Desengordurante super concentrado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/PROFOODMIXP31-300x300.webp' },
  { name: 'Desinfetante desengordurante P20', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/pro_food_mix_P20_DESINFETANTEDESENGORDURANTE-300x300.webp' },
  { name: 'Desinfetante para limpar sapatos', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/desinfect_shoes_desintetante_YS-300x300.webp' },
  { name: 'Desinfetante Sanit DESINFECT', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/sanit_desinfect_desinfectante_de_superticies_para_sector_da_saude_proder_pharma-300x300.webp' },
  { name: 'Desinfetante Sanit P20', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/SanitP20-300x300.webp' },
  { name: 'Desinfetante Sanit VIROXI SPRAY', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/VIROXISPRAY-300x300.webp' },
  { name: 'Detergente Anticalcário', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/11/deo-due-anticalcare-300x300.jpg' },
  { name: 'Detergente auxiliar alcalino e sequestrante', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/FORBAS-300x300.webp' },
  { name: 'Detergente clareador para roupas coloridas', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/11/deo-due-ultra-power-colori-300x300.jpg' },
  { name: 'Detergente clorado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/for_chlor_detergente_clorado_fortex-300x300.webp' },
  { name: 'Detergente clorado em gel', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/solim_clorogel_ys-300x300.webp' },
  { name: 'Detergente com cera autobrilhante e antiderrapante', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/lava_e_encera_detergente_YS-300x300.webp' },
  { name: 'Detergente concentrado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/pro_clean_higigras_3000_detergente_concentrado_proder-300x300.webp' },
  { name: 'Detergente de roupa sólido', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/PROSOLID-300x300.webp' },
  // Página 4
  { name: 'Detergente de sabão neutro', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/pro_floor_parket_detergente_de_sabao_neutro_proder-300x300.webp' },
  { name: 'Detergente desengordurante Hand P60', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/05/hand_P60_limpador_polidor_proder-300x300.webp' },
  { name: 'Detergente desinfetante e ambientador concentrado GS 100', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/GS_100_Limao_Ys-300x300.webp' },
  { name: 'Detergente desinfetante líquido', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/DESINFECT_EXTRA-300x300.webp' },
  { name: 'Detergente desinfetante perfumado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/pro_clean_higicuat_detergente_desinfetante_perfumado_proder-300x300.webp' },
  { name: 'Detergente lava-louças automática', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/pro_wash_20_detergente_lava_loucas_proder-300x300.webp' },
  { name: 'Detergente lava-louças sólido compacto', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/compack_solid_detergente_lava_loica_solido_proder-300x300.webp' },
  { name: 'Detergente líquido concentrado Degras Bac', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/05/degrasbac-300x300.webp' },
  { name: 'Detergente líquido para máquina de lavar-louça', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/W10ALDT-300x300.webp' },
  { name: 'Detergente liquido pré-lavagem e lavagem para a roupa', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/FORFLOW-300x300.webp' },
  { name: 'Detergente manual de louça alta densidade', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/handgrass_detergente_manual_lava_loica_fortex-300x300.webp' },
  { name: 'Detergente Multiusos Económico', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/multiusos_eco_herbal_ys-300x300.webp' },
  { name: 'Detergente multiusos GS 15', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/GS15limao-300x300.webp' },
  { name: 'Detergente multiusos SOLIM LG', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/solim_lg_aloe_ys-300x300.webp' },
  { name: 'Detergente neutro concentrado multiusos', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Detergente_Super_Neutro_Plus_YS-300x300.webp' },
  { name: 'Detergente para a roupa', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/stark_det_blue_detergente_roupa_YS-300x300.webp' },
  // Página 5
  { name: 'Detergente para a roupa PROLIQUID', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/PROLIQUID-1-300x300.webp' },
  { name: 'Detergente para casa de banho', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/solim_wc_higiene_ys-300x300.webp' },
  { name: 'Detergente para estofos e tecidos concentrado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/carpex_plus_lava_estofos_YS-300x300.webp' },
  { name: 'Detergente para lavagem manual de louça', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/solim_louca_verde_detergente_manual_louca_SY-300x300.webp' },
  { name: 'Detergente para manchas de tinta', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/stark_d36_dispersante_reparador_de_tingidos_YS-300x300.webp' },
  { name: 'Detergente para roupa', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/lavatrice4-300x300.jpg' },
  { name: 'Detergente para roupa branca', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/11/deo-due-ultra-power-bianco-300x300.jpg' },
  { name: 'Dispersão metálica concentrada', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Dispersao_metalica_concentrada-300x300.webp' },
  { name: 'Eco One P48', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/eco-one-48-300x300.jpg' },
  { name: 'Esfregão de aço inoxidável', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Esfregaodeacoinoxidavel-300x300.webp' },
  { name: 'Esfregão de aço inoxidável com esponja', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/EsfregaodeAcoinoxidavelcomEsponja-300x300.webp' },
  { name: 'Esfregão de fibra verde cortado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Esfregaodefibraverdecortado-300x300.webp' },
  { name: 'Esfregona 100% microfibra', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Esfregona100_microfibra-300x300.webp' },
  { name: 'Esfregona industrial de algodão Kentucky', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/EsfregonaindustrialdealgodaoKentucky-300x300.webp' },
  { name: 'Esfregona industrial Kentucky TrisTras', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/EsfregonaindustrialKentucky_Tristras-300x300.webp' },
  { name: 'Esfregona leve com mini trança branca', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Esfregonalevecomminitrancabranca-300x300.webp' },
  // Página 6
  { name: 'Esfregona leve com tiras de microfibra Terry', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/EsfregonalevecomtirasdemicrofibraTerry-300x300.webp' },
  { name: 'Esfregona leve de algodão branco XL', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/EsfregonalevedealgodaobrancoXL-300x300.webp' },
  { name: 'Esfregona leve mini trança bicolor', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Esfregonaleveminitrancabicolor-300x300.webp' },
  { name: 'Esfregona ligerina de pano', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/EsfregonaLigerinadePano_4d65b285-be23-47cc-a8fc-bc83f163c3d3-300x300.webp' },
  { name: 'Esfregona ligerina de rede', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/EsfregonaLigerinadeRede-300x300.webp' },
  { name: 'Esfregona microblack preta', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/EsfregonaMicroblackPreta-300x300.webp' },
  { name: 'Esfregona profissional de algodão', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/EsfregonaProfissionaldeAlgodao-300x300.webp' },
  { name: 'Esfregona profissional Tris-Tras', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/EsfregonaProfissionalTRIS-TRASCoresSortidas-300x300.webp' },
  { name: 'Esponjas', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Esponjas-300x300.webp' },
  { name: 'Esponjas para vidrocerâmica', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Esponjasparavidroceramica-300x300.webp' },
  { name: 'Esponjas profissionais 14x7cm', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Esponjasprofissionais14x7cm-300x300.webp' },
  { name: 'Gel desinfetante Sanit IPA NE 5 Litros', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/sanit-ipa-ne-5lts-300x300.jpg' },
  { name: 'Gel detergente desinfetante concentrado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/gel_detergente_desifectante_concentrado_pro_clean_desinfect_prodex-300x300.webp' },
  { name: 'Gel Sanit Virugel 500ml', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/sanit-virugel-500ml-300x300.jpg' },
  { name: 'Guardanapo P.P. 40x40', imageUrl: 'https://patakus.pt/wp-content/uploads/2025/11/Guardanapo-P.P.-40x40-Preto-300x300.png' },
  { name: 'Guardanapo Renova 29x30', imageUrl: 'https://patakus.pt/wp-content/uploads/2025/11/Guardanapo-Renova-29x30-1-300x300.png' },
  // Página 7
  { name: 'Lava-louça automático águas médias', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/for_med_lava_louca_automatico_20L_fortex-300x300.webp' },
  { name: 'Lava-louça automático para águas duras', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/for_dur_lava_louca_automatico_fortex-300x300.webp' },
  { name: 'Limpa vidros multiusos', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/limpa_vidros_glass_clean_45D_ys-300x300.webp' },
  { name: 'Limpa-vidros concentrado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/glass_clean_45_limpa_vidros_YS-300x300.webp' },
  { name: 'Limpa-vidros e superfícies', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/limpa-vidros-e-superficies-300x300.jpg' },
  { name: 'Limpa-vidros Flyst Vitro', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/05/flyst-vitro-750ml5L-300x300.webp' },
  { name: 'Limpador anti-calcário para casas de banho', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/higibac_limpador_anti_calcario_para_casas_de_banho_fortex-300x300.webp' },
  { name: 'Limpador concentrado antiestático Floor Parf', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/05/Floor-300x300.webp' },
  { name: 'Limpador concentrado de ação instantânea Flyst Hard', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/pro_lyst_hard_limpador_multiusos_concentrado_proder-300x300.webp' },
  { name: 'Limpador de piso', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Limpador-de-Piso-ozonato-300x300.jpg' },
  { name: 'Limpador de pisos neutro', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/FLOORPS3-300x300.webp' },
  { name: 'Limpador desinfetante líquido concentrado', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/VIROXI-300x300.webp' },
  { name: 'Limpador multiusos concentrado Flyst Dry', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/05/flystdry-300x300.webp' },
  { name: 'Limpeza de viaturas', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Truck-car_patakus-300x300.webp' },
  { name: 'Liquido desinfetante hidroalcoólico neutro', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Liquido_desinfetante_hidroalcoolico_neutro-300x300.webp' },
  { name: 'Líquido universal limpa quadros e ecrãs', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/screen_clean_limpa_quadros_ecras30-300x300.webp' },
  // Página 8
  { name: 'Luva de Látex', imageUrl: 'https://patakus.pt/wp-content/uploads/2025/11/Luva-Latex-XL-300x300.png' },
  { name: 'Luva de Nitrilo ECO', imageUrl: 'https://patakus.pt/wp-content/uploads/2025/11/Luva-Nitrilo-Azul-ECO-L-300x300.png' },
  { name: 'Luva de Nitrilo Extra Forte', imageUrl: 'https://patakus.pt/wp-content/uploads/2025/11/Luva-Nitrilo-Azul-Extra-Forte-M-300x300.png' },
  { name: 'Luva de Nitrilo Premium', imageUrl: 'https://patakus.pt/wp-content/uploads/2025/11/Luva-Nitrilo-Azul-Premium-M-300x300.png' },
  { name: 'Luva de Vinil', imageUrl: 'https://patakus.pt/wp-content/uploads/2025/11/Luva-Vinil-XL-300x300.png' },
  { name: 'Oxidante desinfetante OX BLAU L', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/OXBLAUL-300x300.webp' },
  { name: 'Pá de lixo dobrável', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Pacomdobra-300x300.webp' },
  { name: 'Pano de microfibra 38x40', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Panodemicrofibra38x40-300x300.webp' },
  { name: 'Pano de microfibra especial para vidros e espelhos', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Panodemicrofibraespecialparavidroseespelhos-300x300.webp' },
  { name: 'Pano ecológico para talheres', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Panoecologicoparatalheres-300x300.webp' },
  { name: 'Papel higiénico jumbo 12 rolos', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/papel-higienico-industrial-300x300.webp' },
  { name: 'Perfumador de roupa lavanda 750ml', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/perfumador-300x300.webp' },
  { name: 'Perfumador para roupa', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Perfumador-para-roupa-DeoDue-Estate-rosa-300x300.jpg' },
  { name: 'Produto limpeza Degras Seven', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Pro_clean-300x300.webp' },
  { name: 'Purificador de água para legumes', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/DESINFECTALIBACFOOD-300x300.webp' },
  { name: 'Recarga esfregona 100% microfibra branco', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Recargaesfregao100microfibrabranco-300x300.webp' },
  // Página 9
  { name: 'Removedor de calcário', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/pro_wash_cal_removedor_de_calcario_proder-300x300.webp' },
  { name: 'Restaurador e protetor de pneus e borrachas', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/brilpneu_ys-300x300.webp' },
  { name: 'Rolo Air-Laid 1.3', imageUrl: 'https://patakus.pt/wp-content/uploads/2025/11/Rolo-Air-Laid-1.3-300x300.jpg' },
  { name: 'Rolo de fibra verde', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Rolodefibraverde-300x300.webp' },
  { name: 'Rolo Industrial 350 m', imageUrl: 'https://patakus.pt/wp-content/uploads/2025/11/Rolo-Indsustrial-350mts-300x300.png' },
  { name: 'Rolo Marquesa 60 cm x 60 m', imageUrl: 'https://patakus.pt/wp-content/uploads/2025/11/Rolo-Marquesa-60cm-x-60mts-300x300.png' },
  { name: 'Rolo Zeta 100 m', imageUrl: 'https://patakus.pt/wp-content/uploads/2025/11/Rolo-Zeta-100mts-300x300.jpg' },
  { name: 'Sabão Sanit Scrub 500ml', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/sanit-scrub-500ml-300x300.jpg' },
  { name: 'Sabonete líquido cremoso', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Blownys_sabonete_liquido-300x300.webp' },
  { name: 'Sabonete líquido para as mãos', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Blowny_Sabonete_Liquido_Frutos_Vermelhos-300x300.webp' },
  { name: 'Sanit Foam Clean Plus 500ml', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/sanit-foam-clean-plus-300x300.jpg' },
  { name: 'Secante e abrilhantador para máquina de lavar-louça', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/s10_brilsec_secante_e_abrilhantador-300x300.webp' },
  { name: 'Shampoo concentrado de lavagem automática de veículos', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/car_wash_d18_ys-300x300.webp' },
  { name: 'Spray perfumador', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/Spray-Perfumador-–-Gama-Profissional-Baunilha-300x300.jpg' },
  { name: 'Tira-nódoas Ox tech', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/oxtech1-300x300.webp' },
  { name: 'Vassoura moya', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/VassouraMoya-300x300.webp' },
  // Página 10
  { name: 'Vassoura Super', imageUrl: 'https://patakus.pt/wp-content/uploads/2024/04/VassouraSuper-300x300.webp' },
];

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreMatch(siteNorm, dbNorm) {
  // Palavras do produto do site
  const siteWords = siteNorm.split(' ').filter(w => w.length > 2);
  const dbWords = dbNorm.split(' ').filter(w => w.length > 2);

  let matches = 0;
  for (const w of siteWords) {
    if (dbNorm.includes(w)) matches++;
  }

  // Score = proporção de palavras do site encontradas no nome DB
  const score = siteWords.length > 0 ? matches / siteWords.length : 0;

  // Bonus se o DB name está contido no site name ou vice-versa
  if (dbNorm.includes(siteNorm) || siteNorm.includes(dbNorm)) return score + 0.5;

  return score;
}

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'cathie',
    database: 'patakus',
  });

  const [rows] = await conn.execute('SELECT id, name FROM products ORDER BY name');
  await conn.end();

  const dbProducts = rows.map(r => ({
    id: r.id,
    name: r.name,
    norm: normalize(r.name),
  }));

  console.log(`\n${'='.repeat(80)}`);
  console.log(`ANÁLISE DE CORRESPONDÊNCIA: ${SITE_PRODUCTS.length} produtos do site vs ${dbProducts.length} na DB`);
  console.log('='.repeat(80));

  const matched = [];
  const noMatch = [];
  const THRESHOLD = 0.5;

  for (const sp of SITE_PRODUCTS) {
    const siteNorm = normalize(sp.name);

    let bestScore = 0;
    let bestMatches = [];

    for (const dp of dbProducts) {
      const score = scoreMatch(siteNorm, dp.norm);
      if (score > bestScore) {
        bestScore = score;
        bestMatches = [dp];
      } else if (score === bestScore && score > 0) {
        bestMatches.push(dp);
      }
    }

    if (bestScore >= THRESHOLD && bestMatches.length > 0) {
      matched.push({
        site: sp.name,
        db: bestMatches[0].name,
        dbId: bestMatches[0].id,
        score: bestScore,
        ambiguous: bestMatches.length > 1,
        alternatives: bestMatches.slice(1, 4).map(m => m.name),
        imageUrl: sp.imageUrl,
      });
    } else {
      noMatch.push({ site: sp.name, bestScore, bestGuess: bestMatches[0]?.name });
    }
  }

  console.log(`\n✅ COM MATCH (${matched.length}):`);
  console.log('-'.repeat(80));
  for (const m of matched) {
    const flag = m.ambiguous ? ' ⚠️ AMBÍGUO' : '';
    console.log(`SITE: "${m.site}"`);
    console.log(`  DB: "${m.db}" (score: ${m.score.toFixed(2)})${flag}`);
    if (m.ambiguous) console.log(`  Outras opções: ${m.alternatives.join(' | ')}`);
    console.log();
  }

  console.log(`\n❌ SEM MATCH (${noMatch.length}):`);
  console.log('-'.repeat(80));
  for (const n of noMatch) {
    console.log(`"${n.site}" (melhor score: ${n.bestScore.toFixed(2)} → "${n.bestGuess}")`);
  }

  console.log(`\n📊 RESUMO: ${matched.length} matches, ${noMatch.length} sem match de ${SITE_PRODUCTS.length} total`);
}

main().catch(console.error);
