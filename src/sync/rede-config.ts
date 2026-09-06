// Configuração fixa da malha P2P.
//
// Este app é de UMA igreja só — "O Rebanho de Jesus Cristo". Por isso não há
// código para digitar: todo aparelho que instala o app pertence à mesma igreja
// e entra na mesma "sala" da rede. O primeiro cadastro é o pastor; os demais
// entram como membros e o pastor define os papéis.
//
// A senha abaixo cifra o aperto de mão da rede (só quem tem o app conversa).
// Como o site é público, ela não é um segredo forte — a garantia real de que
// ninguém adultera dados é a assinatura de cada operação, não esta senha.

export const APP_ID = 'rebanho-de-jesus-cristo'

/** Sala única da igreja na malha. Todos os aparelhos entram aqui. */
export const SALA_IGREJA = 'rebanho-jesus-cristo-oficial-v1'

/** Cifra o handshake entre os aparelhos do app. */
export const SENHA_MALHA = 'ovelhas-do-bom-pastor-2024-rebanho-malha'
