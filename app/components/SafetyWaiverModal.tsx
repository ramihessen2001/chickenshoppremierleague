/**
 * The YM Safety Waiver, read-only.
 *
 * Opened from the registration form's consent checkbox. The text is held here
 * rather than in the form so the form stays about collecting fields, and so
 * the waiver can be linked from anywhere else that needs it later.
 */

'use client'

import { Modal, buttonPrimary, buttonSecondary } from './Modal'

const INTRO =
  'This Agreement is made between Young Muslims (YM) and the undersigned Participant (or Parent/Guardian if under 18). It applies to all official YM-recognized NeighborNet activities for the calendar year, including but not limited to halaqas, volunteer projects, service activities, sports, meetings, community events, and related travel/carpooling.'

/** Each clause keeps its printed number so the text matches the signed copy. */
const SECTIONS: { title: string; clauses: [string, string][] }[] = [
  {
    title: '1. Participation & Eligibility',
    clauses: [
      [
        '1.1',
        'I understand that Young Muslims (YM) events and gatherings are intended for youth aged 14–25 unless otherwise stated.',
      ],
      [
        '1.2',
        'I understand that participation is voluntary, and I am joining by my own choice or with my parent/guardian’s consent.',
      ],
    ],
  },
  {
    title: '2. Behavior & Conduct',
    clauses: [
      [
        '2.1',
        'I agree to conduct myself in a manner that reflects Islamic morals and respect toward all organizers, participants, and public spaces.',
      ],
      [
        '2.2',
        'I understand that Young Muslims (YM) reserves the right to remove or restrict participation for unsafe, inappropriate, or disruptive behavior.',
      ],
    ],
  },
  {
    title: '3. Facilities & Transportation',
    clauses: [
      [
        '3.1',
        'YM often uses facilities such as masaajid, community centers, schools, and public spaces. Participant releases YM and all host facilities from liability related to use of such venues.',
      ],
      [
        '3.2',
        'I acknowledge that some YM activities may include driving, pickup/drop-off coordination, and outings beyond indoor spaces (e.g., parks, volunteer sites, or masjid trips).',
      ],
      [
        '3.3',
        'I understand that only approved adult drivers or licensed participants may drive other participants to or from YM activities.',
      ],
      [
        '3.4',
        'I agree that all driving will follow legal age, passenger, and safety restrictions.',
      ],
      [
        '3.5',
        'I understand that transportation and carpooling arranged through YM is voluntary and that Young Muslims (YM) is not responsible for incidents, accidents, or damages that may occur during transportation or outside of supervised event areas.',
      ],
      [
        '3.6',
        'I understand and will communicate whether my departure from the Qiyam is at a time outside the normal departure time to the Neighbor-Net Coordinator.',
      ],
    ],
  },
  {
    title: '4. Health & Emergency Care',
    clauses: [
      [
        '4.1',
        'I will inform YM organizers of any allergies, medications, or physical/mental medical conditions before participating.',
      ],
      [
        '4.2',
        'In case of emergency, I authorize Young Muslims (YM) to provide/seek medical assistance and contact my emergency contact as necessary.',
      ],
      [
        '4.3',
        'I release Young Muslims (YM) and its representatives from liability for medical treatment or emergency response provided in good faith.',
      ],
    ],
  },
  {
    title: '5. Safety & Risk',
    clauses: [
      [
        '5.1',
        'I understand that YM activities may involve movement, travel, or physical activity and accept the inherent risks associated with participation.',
      ],
      [
        '5.2',
        'I take full responsibility for any injury, illness, or property damage resulting from my own actions that may occur during YM events or outings.',
      ],
    ],
  },
  {
    title: '6. Media & Communication',
    clauses: [
      [
        '6.1',
        'I understand that photos or videos may be taken for YM promotional, archival, or community purposes.',
      ],
      [
        '6.2',
        'I will notify organizers if I wish to opt out of being photographed or recorded. I understand that Young Muslims (YM) will make reasonable efforts to honor such requests, but cannot control or be held liable for photos, videos, or recordings taken or shared by other participants or members of the public.',
      ],
      [
        '6.3',
        'I agree to use YM communication channels (e.g., WhatsApp, email, or social media) respectfully and appropriately.',
      ],
    ],
  },
  {
    title: '7. Waiver of Liability & Indemnity',
    clauses: [
      [
        '7.1',
        'In consideration of being permitted to participate, I release and hold harmless Young Muslims (YM), its officers, volunteers, affiliates, and host facilities from all claims or liabilities arising out of participation in YM activities, including injury, illness, death, or property loss, except in cases of gross negligence or willful misconduct.',
      ],
      [
        '7.2',
        'This waiver applies to the maximum extent allowed by law and remains effective for all YM activities during the calendar year.',
      ],
    ],
  },
  {
    title: '8. Binding Arbitration & Governing Law',
    clauses: [
      [
        '8.1',
        'Any dispute or claim arising from this Agreement or YM participation will be settled by final, binding arbitration before a neutral arbitrator in the state where the event occurred.',
      ],
      [
        '8.2',
        'I waive any right to a lawsuit, jury trial, or class action, and agree that the arbitrator’s decision will be final.',
      ],
      [
        '8.3',
        'This Agreement is governed by the laws of the state where the YM activity takes place.',
      ],
    ],
  },
  {
    title: '9. Acknowledgment of Understanding',
    clauses: [
      [
        '9.1',
        'I have carefully read this Agreement, fully understand its contents, and sign it voluntarily.',
      ],
      [
        '9.2',
        'I understand that by signing, I am waiving substantial legal rights, including the right to sue.',
      ],
      [
        '9.3',
        'If the participant is under 18, I affirm I am the parent/legal guardian with authority to sign on their behalf and consent to these terms.',
      ],
    ],
  },
]

const DISCLAIMER =
  'For purposes of this Agreement, “I,” “me,” and “my” refer to the adult participant signing this Agreement, or, if the participant is under 18, to the parent/legal guardian signing on the minor participant’s behalf.'

const CONTACTS = [
  { name: 'Imaad Khan', phone: '+1 (815) 919-1088', email: 'imaad.khan@youngmuslims.com' },
  { name: 'Zaid Khan', phone: '+1 (516) 655-7599', email: 'zaid.khan@youngmuslims.com' },
]

interface SafetyWaiverModalProps {
  isOpen: boolean
  onClose: () => void
  /** Ticks the consent checkbox on the form and closes. */
  onAgree: () => void
}

export function SafetyWaiverModal({
  isOpen,
  onClose,
  onAgree,
}: SafetyWaiverModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="YM Safety Waiver"
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonSecondary}>
            Close
          </button>
          <button type="button" onClick={onAgree} className={buttonPrimary}>
            I agree
          </button>
        </>
      }
    >
      <p className="text-[14px] leading-relaxed text-ink-secondary">{INTRO}</p>

      {SECTIONS.map((section) => (
        <section key={section.title} className="mt-6">
          <h3 className="text-[14px] font-semibold text-ink">{section.title}</h3>
          <div className="mt-2 grid gap-2">
            {section.clauses.map(([number, text]) => (
              <p
                key={number}
                className="text-[14px] leading-relaxed text-ink-secondary"
              >
                <span className="font-medium text-ink-tertiary">{number}</span>{' '}
                {text}
              </p>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-6">
        <h3 className="text-[14px] font-semibold text-ink">10. Disclaimer</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">
          {DISCLAIMER}
        </p>
      </section>

      <section className="mt-6 border-t border-hairline pt-6">
        <p className="text-[14px] leading-relaxed text-ink-secondary">
          For more information about Safety &amp; Compliance at a National level
          for Young Muslims, reach out to:
        </p>
        <ul className="mt-3 grid gap-2">
          {CONTACTS.map((contact) => (
            <li key={contact.email} className="text-[14px] text-ink-secondary">
              <span className="font-medium text-ink">{contact.name}</span>{' '}
              <span className="text-ink-tertiary">—</span>{' '}
              <a
                href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}
                className="text-accent-ink transition-opacity hover:opacity-70"
              >
                {contact.phone}
              </a>{' '}
              <span className="text-ink-tertiary">|</span>{' '}
              <a
                href={`mailto:${contact.email}`}
                className="text-accent-ink transition-opacity hover:opacity-70"
              >
                {contact.email}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Modal>
  )
}
