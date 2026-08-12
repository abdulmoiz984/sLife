import React from 'react';
import { View, Image, StyleSheet, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Typography } from '../../atomComponents';
import { COLORS, GRADIENTS, RADIUS } from '../../globalStyle/Theme';
import { AVAILABILITY_LABELS } from '../../constants/mockData';
import { getProfileCompletion } from '../../helpers/profileCompletion';
import { onboardBoardroom } from '../../assets/images';
import Avatar from './Avatar';
import Chip from './Chip';
import SectionLabel from './SectionLabel';
import VerifiedBadge from './VerifiedBadge';
import Icon from './Icon';

const Section = ({ title, children, show = true }) => {
  if (!show) return null;
  return (
    <View style={styles.section}>
      <SectionLabel>{title}</SectionLabel>
      {children}
    </View>
  );
};

const ListBlock = ({ items }) => (
  <View>
    {items.map(item => (
      <View key={item} style={styles.listRow}>
        <Icon.Check size={16} color={COLORS.primary} />
        <Typography fixed size={13} color={COLORS.body} style={styles.listText}>
          {item}
        </Typography>
      </View>
    ))}
  </View>
);

const IconBox = ({ children }) => <View style={styles.iconBox}>{children}</View>;

const FullProfileView = ({
  person,
  actions,
  headerActions,
  showCompletion = false,
  scroll = true,
}) => {
  const completion = getProfileCompletion(person);
  const cover = person.cover ?? onboardBoardroom;

  const content = (
    <>
      <View>
        <View style={styles.coverWrap}>
          <Image source={cover} style={styles.cover} />
          <LinearGradient colors={GRADIENTS.cover} style={StyleSheet.absoluteFill} />
          {headerActions}
        </View>
        <View style={styles.avatarWrap}>
          <Avatar src={person.avatar} size={96} tier={person.tier} />
        </View>
      </View>

      <View style={styles.intro}>
        {showCompletion && (
          <View style={styles.completion}>
            <View style={styles.completionRow}>
              <Typography
                fixed
                size={11}
                fFamily="interSemiBold600"
                color={COLORS.mute}
                textTransform="uppercase"
                style={styles.track}>
                Profile completion
              </Typography>
              <Typography fixed size={12} fFamily="interSemiBold600" color={COLORS.primary}>
                {completion}%
              </Typography>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${completion}%` }]} />
            </View>
          </View>
        )}

        <Typography fixed size={24} fFamily="spaceGroteskBold700" color={COLORS.foreground}>
          {person.name}
        </Typography>
        <Typography fixed size={14} color={COLORS.body} mT={4}>
          {person.headline}
        </Typography>
        {!!person.shortIntro && (
          <Typography fixed size={13} color={COLORS.mute} mT={8} LineHeight={20}>
            {person.shortIntro}
          </Typography>
        )}

        <View style={styles.badgeRow}>
          <VerifiedBadge tier={person.tier} />
          {!!person.availability && (
            <View style={styles.availBadge}>
              <Typography
                fixed
                size={11}
                fFamily="interSemiBold600"
                color={COLORS.primary}
                textTransform="uppercase"
                style={styles.trackSmall}>
                {AVAILABILITY_LABELS[person.availability]}
              </Typography>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon.Building size={16} color={COLORS.mute} />
            <Typography fixed size={13} color={COLORS.mute}>
              {person.currentPosition} · {person.company}
            </Typography>
          </View>
          <View style={styles.metaItem}>
            <Icon.Pin size={16} color={COLORS.mute} />
            <Typography fixed size={13} color={COLORS.mute}>
              {person.location}
            </Typography>
          </View>
        </View>

        {(person.industry || person.yearsExperience != null || person.timezone) && (
          <Typography fixed size={12} color={COLORS.mute} mT={8}>
            {[
              person.industry,
              person.yearsExperience != null ? `${person.yearsExperience}+ years experience` : null,
              person.timezone?.replace(/_/g, ' '),
            ]
              .filter(Boolean)
              .join('  ·  ')}
          </Typography>
        )}

        {person.lookingFor?.length > 0 && (
          <View style={styles.chipWrap}>
            {person.lookingFor.map(item => (
              <Chip key={item} label={`Looking for: ${item}`} active />
            ))}
          </View>
        )}

        {!!actions && <View style={styles.actions}>{actions}</View>}
      </View>

      <View style={styles.body}>
        <Section title="About" show={!!person.bio}>
          <Typography fixed size={14} color={COLORS.body} LineHeight={23}>
            {person.bio}
          </Typography>
          {!!person.videoIntro && (
            <View style={styles.videoCard}>
              <IconBox>
                <Icon.Mic size={20} color={COLORS.primary} />
              </IconBox>
              <View>
                <Typography fixed size={13} fFamily="interSemiBold600" color={COLORS.foreground}>
                  Video introduction
                </Typography>
                <Typography fixed size={12} color={COLORS.mute}>
                  {person.videoIntro}
                </Typography>
              </View>
            </View>
          )}
        </Section>

        <Section title="Professional experience" show={person.experience?.length > 0}>
          {person.experience.map(e => (
            <View key={`${e.role}-${e.company}`} style={styles.card}>
              <View style={styles.cardRow}>
                <IconBox>
                  <Icon.Building size={20} color={COLORS.primary} />
                </IconBox>
                <View style={styles.cardCopy}>
                  <Typography fixed size={14} fFamily="interSemiBold600" color={COLORS.foreground}>
                    {e.role}
                  </Typography>
                  <Typography fixed size={12} color={COLORS.body}>
                    {e.company}
                  </Typography>
                  {!!e.description && (
                    <Typography fixed size={12} color={COLORS.mute} mT={4} LineHeight={18}>
                      {e.description}
                    </Typography>
                  )}
                </View>
                <Typography
                  fixed
                  size={11}
                  color={COLORS.mute}
                  textTransform="uppercase"
                  style={styles.period}>
                  {e.period}
                </Typography>
              </View>
            </View>
          ))}
        </Section>

        <Section title="Education" show={person.education?.length > 0}>
          {person.education.map(e => (
            <View key={`${e.school}-${e.degree}`} style={styles.card}>
              <View style={styles.cardRow}>
                <IconBox>
                  <Icon.Doc size={20} color={COLORS.primary} />
                </IconBox>
                <View style={styles.cardCopy}>
                  <Typography fixed size={14} fFamily="interSemiBold600" color={COLORS.foreground}>
                    {e.school}
                  </Typography>
                  <Typography fixed size={12} color={COLORS.body}>
                    {e.degree}
                    {e.field ? ` · ${e.field}` : ''}
                  </Typography>
                </View>
                <Typography
                  fixed
                  size={11}
                  color={COLORS.mute}
                  textTransform="uppercase"
                  style={styles.period}>
                  {e.period}
                </Typography>
              </View>
            </View>
          ))}
        </Section>

        <Section title="Certifications" show={person.certifications?.length > 0}>
          {person.certifications.map(c => (
            <View key={c.name} style={styles.listRow}>
              <Icon.Doc size={16} color={COLORS.primary} />
              <View>
                <Typography fixed size={13} color={COLORS.body}>
                  {c.name}
                </Typography>
                {(c.issuer || c.year) && (
                  <Typography fixed size={11} color={COLORS.mute}>
                    {[c.issuer, c.year].filter(Boolean).join(' · ')}
                  </Typography>
                )}
              </View>
            </View>
          ))}
        </Section>

        <Section title="Licenses" show={(person.licenses?.length ?? 0) > 0}>
          {person.licenses?.map(l => (
            <View key={l.name} style={styles.listRow}>
              <Icon.Doc size={16} color={COLORS.primary} />
              <View>
                <Typography fixed size={13} color={COLORS.body}>
                  {l.name}
                </Typography>
                <Typography fixed size={11} color={COLORS.mute}>
                  {[l.issuer, l.number].filter(Boolean).join(' · ')}
                </Typography>
              </View>
            </View>
          ))}
        </Section>

        <Section title="Career highlights & achievements" show={(person.highlights?.length ?? 0) > 0}>
          <ListBlock items={person.highlights ?? []} />
        </Section>

        <Section title="Awards & recognition" show={(person.awards?.length ?? 0) > 0}>
          <ListBlock items={person.awards ?? []} />
        </Section>

        <Section title="Skills & expertise" show={person.skills?.length > 0}>
          <View style={styles.chipWrap}>
            {person.skills.map(s => (
              <Chip key={s} label={s} />
            ))}
          </View>
        </Section>

        <Section title="Areas of specialization" show={(person.specializations?.length ?? 0) > 0}>
          <View style={styles.chipWrap}>
            {person.specializations?.map(s => (
              <Chip key={s} label={s} active />
            ))}
          </View>
        </Section>

        <Section title="Professional interests" show={person.interests?.length > 0}>
          <View style={styles.chipWrap}>
            {person.interests.map(i => (
              <Chip key={i} label={i} active />
            ))}
          </View>
        </Section>

        <Section title="Networking goals" show={(person.networkingGoals?.length ?? 0) > 0}>
          <View style={styles.chipWrap}>
            {person.networkingGoals?.map(g => (
              <Chip key={g} label={g} />
            ))}
          </View>
        </Section>

        <Section title="Languages" show={(person.languages?.length ?? 0) > 0}>
          <View style={styles.chipWrap}>
            {person.languages?.map(l => (
              <Chip key={l} label={l} />
            ))}
          </View>
        </Section>

        <Section
          title="Featured projects"
          show={(person.projects?.filter(p => p.featured).length ?? 0) > 0}>
          {person.projects
            ?.filter(p => p.featured)
            .map(p => (
              <View key={p.title} style={styles.card}>
                <Typography fixed size={14} fFamily="interSemiBold600" color={COLORS.foreground}>
                  {p.title}
                </Typography>
                {!!p.description && (
                  <Typography fixed size={12} color={COLORS.body} mT={4}>
                    {p.description}
                  </Typography>
                )}
                {!!p.url && (
                  <Typography fixed size={11} color={COLORS.primary} mT={8}>
                    {p.url}
                  </Typography>
                )}
              </View>
            ))}
        </Section>

        <Section title="Portfolio links" show={(person.portfolioLinks?.length ?? 0) > 0}>
          {person.portfolioLinks?.map(l => (
            <View key={l.url} style={styles.listRow}>
              <Icon.Globe size={16} color={COLORS.primary} />
              <View>
                <Typography fixed size={13} fFamily="interSemiBold600" color={COLORS.foreground}>
                  {l.label}
                </Typography>
                <Typography fixed size={11} color={COLORS.mute}>
                  {l.url}
                </Typography>
              </View>
            </View>
          ))}
        </Section>

        <Section title="Documents" show={(person.documents?.length ?? 0) > 0}>
          {person.documents?.map(d => (
            <View key={d.name} style={[styles.card, styles.docCard]}>
              <IconBox>
                <Icon.Doc size={20} color={COLORS.primary} />
              </IconBox>
              <View style={styles.cardCopy}>
                <Typography
                  fixed
                  size={13}
                  fFamily="interSemiBold600"
                  color={COLORS.foreground}
                  numberOfLines={1}>
                  {d.name}
                </Typography>
                <Typography fixed size={11} color={COLORS.mute} textTransform="capitalize">
                  {d.category}
                </Typography>
              </View>
            </View>
          ))}
        </Section>

        <Section
          title="Contact & online presence"
          show={
            !!(
              person.website ||
              person.linkedin ||
              person.facebook ||
              person.instagram ||
              person.youtube ||
              person.preferredContact
            )
          }>
          <View style={styles.socialRow}>
            {!!person.linkedin && (
              <View style={styles.socialBtn}>
                <Icon.LinkedIn />
              </View>
            )}
            {!!person.website && (
              <View style={styles.socialBtn}>
                <Icon.Globe size={20} color={COLORS.foreground} />
              </View>
            )}
            {!!person.instagram && (
              <View style={styles.socialBtn}>
                <Icon.Instagram size={20} color={COLORS.foreground} />
              </View>
            )}
            {!!person.facebook && (
              <View style={styles.socialBtn}>
                <Icon.Facebook />
              </View>
            )}
          </View>
          {!!person.preferredContact && (
            <Typography fixed size={12} color={COLORS.mute} mT={12}>
              Preferred contact: {person.preferredContact}
            </Typography>
          )}
        </Section>

        <Section title="Business information" show={!!person.business}>
          <View style={styles.card}>
            <Typography fixed size={14} fFamily="interSemiBold600" color={COLORS.foreground}>
              {person.business?.name}
            </Typography>
            {!!person.business?.category && (
              <Typography fixed size={12} color={COLORS.body}>
                {person.business.category}
              </Typography>
            )}
            {!!person.business?.address && (
              <Typography fixed size={12} color={COLORS.mute}>
                {person.business.address}
              </Typography>
            )}
            {!!person.business?.phone && (
              <Typography fixed size={12} color={COLORS.mute}>
                {person.business.phone}
              </Typography>
            )}
            {!!person.business?.email && (
              <Typography fixed size={12} color={COLORS.mute}>
                {person.business.email}
              </Typography>
            )}
          </View>
        </Section>

        <Section title="Professional memberships" show={(person.memberships?.length ?? 0) > 0}>
          <ListBlock items={person.memberships ?? []} />
        </Section>

        <Section title="Volunteer experience" show={(person.volunteer?.length ?? 0) > 0}>
          {person.volunteer?.map(v => (
            <View key={`${v.role}-${v.company}`} style={styles.card}>
              <View style={styles.cardRow}>
                <View style={styles.cardCopy}>
                  <Typography fixed size={14} fFamily="interSemiBold600" color={COLORS.foreground}>
                    {v.role}
                  </Typography>
                  <Typography fixed size={12} color={COLORS.body}>
                    {v.company}
                  </Typography>
                </View>
                <Typography
                  fixed
                  size={11}
                  color={COLORS.mute}
                  textTransform="uppercase"
                  style={styles.period}>
                  {v.period}
                </Typography>
              </View>
            </View>
          ))}
        </Section>

        <Section title="Interests & communities" show={(person.communities?.length ?? 0) > 0}>
          <View style={styles.chipWrap}>
            {person.communities?.map(c => (
              <Chip key={c} label={c} active />
            ))}
          </View>
        </Section>

        <Section title="Featured articles & posts" show={(person.featuredArticles?.length ?? 0) > 0}>
          {person.featuredArticles?.map(a => (
            <View key={a.title} style={styles.listRow}>
              <Icon.Doc size={16} color={COLORS.primary} />
              <Typography fixed size={13} color={COLORS.body}>
                {a.title}
              </Typography>
            </View>
          ))}
        </Section>
      </View>
    </>
  );

  if (!scroll) return content;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scroll}>
      {content}
    </ScrollView>
  );
};

export default FullProfileView;

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 32,
  },
  coverWrap: {
    height: 160,
    overflow: 'hidden',
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  avatarWrap: {
    paddingHorizontal: 20,
    marginTop: -48,
    zIndex: 2,
  },
  intro: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  completion: {
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  track: { letterSpacing: 0.88 },
  trackSmall: { letterSpacing: 0.66 },
  barTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
    borderRadius: RADIUS.full,
  },
  barFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  badgeRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(241,0,0,0.5)',
    borderRadius: RADIUS.full,
  },
  metaRow: {
    marginTop: 12,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  chipWrap: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actions: {
    marginTop: 20,
  },
  body: {
    paddingHorizontal: 20,
    marginTop: 32,
    gap: 32,
    paddingBottom: 24,
  },
  section: {},
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  listText: {
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
  },
  period: {
    letterSpacing: 0.66,
    flexShrink: 0,
  },
  videoCard: {
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialBtn: {
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
  },
});
