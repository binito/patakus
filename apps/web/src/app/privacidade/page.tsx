import Link from 'next/link';

export const metadata = {
  title: 'Política de Privacidade | Patakus',
  robots: { index: false, follow: false },
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 text-gray-700">
      <Link href="/login" className="text-sm text-blue-600 hover:underline">&larr; Voltar</Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900">Política de Privacidade</h1>
      <p className="mt-1 text-sm text-gray-400">
        Última atualização: 8 de junho de 2026
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <p>
          O <strong>Patakus</strong> é uma aplicação de gestão HACCP e operacional para
          restauração. Esta política explica que dados pessoais são tratados através da
          aplicação e como são protegidos, em conformidade com o Regulamento Geral sobre a
          Proteção de Dados (RGPD).
        </p>

        <section>
          <h2 className="text-base font-semibold text-gray-900">1. Responsável pelo tratamento</h2>
          <p className="mt-2">
            {/* TODO: substituir pelos dados legais reais da entidade que opera o Patakus */}
            [Nome da empresa / entidade], [morada], [NIF]. Para questões sobre os seus dados
            pessoais ou sobre esta política, contacte [email de contacto].
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">2. Que dados tratamos</h2>
          <p className="mt-2">A aplicação trata os seguintes tipos de dados pessoais:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Dados de conta:</strong> nome, e-mail e função dos utilizadores (colaboradores das entidades clientes), para acesso e identificação na aplicação;</li>
            <li><strong>Registos operacionais HACCP:</strong> entradas de mercadoria, controlos de temperatura, registos de higienização/desinfeção, óleos de fritura e checklists, associados ao utilizador que os criou e à data/hora do registo;</li>
            <li><strong>Anomalias e fotografias:</strong> descrições e imagens carregadas para reportar não conformidades;</li>
            <li><strong>Dados técnicos de sessão:</strong> token de autenticação e cookie de proteção CSRF, estritamente necessários para manter a sessão segura.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">3. Cookies utilizados</h2>
          <p className="mt-2">
            O Patakus utiliza apenas cookies <strong>estritamente necessários</strong> ao
            funcionamento da aplicação — nomeadamente o cookie de sessão (refresh token,
            HttpOnly) e o cookie de proteção contra falsificação de pedidos (CSRF). Estes
            cookies não requerem consentimento prévio nos termos da Lei das Comunicações
            Eletrónicas, por serem indispensáveis para que possa iniciar e manter sessão em
            segurança. Não utilizamos cookies de publicidade, redes sociais ou de medição de
            audiência (analytics) de terceiros.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">4. Finalidade e fundamento do tratamento</h2>
          <p className="mt-2">
            Os dados são tratados para permitir a utilização da aplicação pelas entidades
            clientes e pelos seus colaboradores — gestão de operações, cumprimento de
            obrigações legais de segurança alimentar (HACCP) e elaboração de relatórios para
            auditorias e inspeções sanitárias. O fundamento de tratamento é a execução do
            contrato de prestação de serviço com a entidade cliente e o cumprimento de
            obrigações legais aplicáveis ao setor da restauração.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">5. Partilha e armazenamento</h2>
          <p className="mt-2">
            Os dados são armazenados em servidores próprios/contratados e não são vendidos
            nem partilhados com terceiros para fins de marketing. Podem ser acedidos por
            prestadores de serviços técnicos que apoiam o alojamento e manutenção da
            aplicação, sempre sob obrigações contratuais de confidencialidade e segurança.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">6. Conservação dos dados</h2>
          <p className="mt-2">
            Os registos operacionais HACCP são conservados pelo período exigido pela
            legislação de segurança alimentar aplicável. Os dados de conta são conservados
            enquanto durar a relação contratual com a entidade cliente, sendo apagados ou
            anonimizados após o seu termo, salvo obrigação legal de conservação mais longa.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">7. Os seus direitos</h2>
          <p className="mt-2">
            Tem direito a aceder, retificar, apagar ou limitar o tratamento dos seus dados
            pessoais, a opor-se ao tratamento e à portabilidade dos dados, bem como a
            apresentar reclamação junto da{' '}
            <a href="https://www.cnpd.pt" target="_blank" rel="noopener" className="text-blue-600 hover:underline">
              Comissão Nacional de Proteção de Dados (CNPD)
            </a>. Para exercer estes direitos, contacte [email de contacto] ou a entidade
            cliente que administra a sua conta.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">8. Alterações a esta política</h2>
          <p className="mt-2">
            Esta política pode ser atualizada para refletir alterações na aplicação ou na
            legislação aplicável. A data da última atualização está indicada no topo desta
            página.
          </p>
        </section>
      </div>

      <Link href="/login" className="mt-10 inline-block text-sm text-blue-600 hover:underline">&larr; Voltar</Link>
    </div>
  );
}
