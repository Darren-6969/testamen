-- One-off backfill: credit referral bonuses that were earned before
-- awardReferralBonus existed.
--
-- Context: Jasmine Pan registered using Jayden Tan's referral code, but the
-- commit recorded the code without crediting anyone. This awards the referrer
-- retroactively. Jasmine correctly keeps a 0 bonus - by the legacy design the
-- referee never earned one.
--
-- Run ONCE, after add_obituary_soft_delete.sql and the controller update.
-- Running it twice would double-credit; the guard below prevents that only for
-- accounts that still have no bonus recorded.

-- Preview first. Nothing is changed by this statement.
SELECT
  ref.id                              AS referrer_id,
  ref.username                        AS referrer,
  ref.referral_code,
  COALESCE(NULLIF(regexp_replace(COALESCE(ref.referral_bonus_mb, ''), '\D', '', 'g'), '')::int, 0)
                                      AS bonus_now_mb,
  COUNT(referee.id)                   AS referrals,
  LEAST(COUNT(referee.id), s.max_referrals) * s.mb_per_referral
                                      AS bonus_should_be_mb
FROM mt_user_account ref
JOIN mt_user_account referee
  ON UPPER(referee.referrer_code) = UPPER(ref.referral_code)
CROSS JOIN (
  SELECT COALESCE(mb_per_referral, 10) AS mb_per_referral,
         COALESCE(max_referrals, 4)    AS max_referrals
    FROM mt_referral_settings
   ORDER BY id ASC
   LIMIT 1
) s
WHERE ref.referral_code IS NOT NULL
  AND ref.referral_code <> ''
GROUP BY ref.id, ref.username, ref.referral_code, ref.referral_bonus_mb,
         s.mb_per_referral, s.max_referrals;

-- Apply. Only touches referrers whose recorded bonus is currently 0 or empty,
-- so anyone already credited is left alone.
UPDATE mt_user_account ref
   SET referral_bonus_mb = (
         LEAST(earned.referrals, s.max_referrals) * s.mb_per_referral
       )::text,
       modified = CURRENT_DATE
  FROM (
        SELECT UPPER(referrer_code) AS code, COUNT(*) AS referrals
          FROM mt_user_account
         WHERE referrer_code IS NOT NULL AND referrer_code <> ''
         GROUP BY UPPER(referrer_code)
       ) earned,
       (
        SELECT COALESCE(mb_per_referral, 10) AS mb_per_referral,
               COALESCE(max_referrals, 4)    AS max_referrals
          FROM mt_referral_settings
         ORDER BY id ASC
         LIMIT 1
       ) s
 WHERE UPPER(ref.referral_code) = earned.code
   AND COALESCE(NULLIF(regexp_replace(COALESCE(ref.referral_bonus_mb, ''), '\D', '', 'g'), '')::int, 0) = 0;