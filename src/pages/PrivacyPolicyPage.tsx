import LegalDocumentLayout from '../components/legal/LegalDocumentLayout'
import { LEGAL_EFFECTIVE_DATE, OPEN_KAKAO_URL, SITE_NAME } from '../lib/site'

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentLayout
      title="개인정보처리방침"
      effectiveDate={LEGAL_EFFECTIVE_DATE}
      intro={`${SITE_NAME}(이하 "서비스")는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침은 서비스가 수집·이용·보관·파기하는 개인정보에 대해 설명합니다.`}
      sections={[
        {
          title: '1. 수집하는 개인정보',
          paragraphs: ['서비스는 다음 정보를 수집할 수 있습니다.'],
          list: [
            'Google 로그인 시: 이메일, 이름, 프로필 사진 등 Google이 제공하는 계정 정보',
            '서비스 이용 시: 캐릭터명, 사냥·지출·드랍·보스·다이어리 등 이용자가 입력한 게임 기록 데이터',
            '자동 수집: 접속 일시, 서비스 이용 기록, 오류 로그 등 기술적 정보',
          ],
        },
        {
          title: '2. 개인정보의 이용 목적',
          paragraphs: ['수집한 정보는 다음 목적에만 사용됩니다.'],
          list: [
            '회원 식별 및 로그인 인증',
            '게임 기록 저장·동기화 및 서비스 제공',
            '서비스 개선, 오류 대응, 문의 처리',
            '법령에 따른 의무 이행',
          ],
        },
        {
          title: '3. 보관 및 파기',
          paragraphs: [
            '이용자의 데이터는 계정 연동 기간 동안 보관됩니다.',
            '이용자가 로그아웃하거나 계정을 삭제 요청한 경우, 관련 법령에 따른 보관 의무가 없는 한 지체 없이 파기합니다.',
            '전자적 파일 형태의 정보는 복구 불가능한 방법으로 삭제합니다.',
          ],
        },
        {
          title: '4. 제3자 제공 및 처리 위탁',
          paragraphs: [
            '서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만 아래와 같이 서비스 운영에 필요한 외부 서비스를 이용할 수 있습니다.',
          ],
          list: [
            'Google: 소셜 로그인 인증',
            'Supabase: 데이터 저장 및 인증 인프라',
          ],
        },
        {
          title: '5. 이용자의 권리',
          paragraphs: [
            '이용자는 언제든지 자신의 개인정보 열람, 수정, 삭제를 요청할 수 있습니다.',
            '캐릭터 및 기록 데이터는 서비스 내 기능을 통해 직접 삭제할 수 있습니다.',
            '그 외 문의는 오픈카톡 채팅방을 통해 연락해 주시면 신속히 처리합니다.',
          ],
        },
        {
          title: '6. 개인정보 보호책임자',
          paragraphs: [
            `개인정보 관련 문의: ${SITE_NAME} 오픈카톡 (${OPEN_KAKAO_URL})`,
            '문의 접수 후 영업일 기준 7일 이내 답변을 드리도록 노력합니다.',
          ],
        },
        {
          title: '7. 방침 변경',
          paragraphs: [
            '본 방침은 법령 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 서비스 내 공지 또는 본 페이지를 통해 안내합니다.',
          ],
        },
      ]}
    />
  )
}
