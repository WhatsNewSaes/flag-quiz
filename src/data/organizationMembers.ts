// Maps organization slugs to arrays of ISO 3166-1 alpha-2 country codes
// Only includes countries that exist in our countries.ts data (197 sovereign states)

export const organizationMembers: Record<string, string[]> = {
  'united-nations': [
    // All 193 UN member states — we include all 195 countries in our data
    // (excludes Vatican City and Palestine which are observer states, plus Taiwan and Kosovo)
    'AF','AL','DZ','AD','AO','AG','AR','AM','AU','AT','AZ','BS','BH','BD','BB','BY','BE','BZ','BJ','BT',
    'BO','BA','BW','BR','BN','BG','BF','BI','CV','KH','CM','CA','CF','TD','CL','CN','CO','KM','CG','CR',
    'HR','CU','CY','CZ','CD','DK','DJ','DM','DO','EC','EG','SV','GQ','ER','EE','SZ','ET','FJ','FI','FR',
    'GA','GM','GE','DE','GH','GR','GD','GT','GN','GW','GY','HT','HN','HU','IS','IN','ID','IR','IQ','IE',
    'IL','IT','JM','JP','JO','KZ','KE','KI','KW','KG','LA','LV','LB','LS','LR','LY','LI','LT','LU','MG',
    'MW','MY','MV','ML','MT','MH','MR','MU','MX','FM','MD','MC','MN','ME','MA','MZ','MM','NA','NR','NP',
    'NL','NZ','NI','NE','NG','MK','NO','OM','PK','PW','PA','PG','PY','PE','PH','PL','PT','QA','RO','RU',
    'RW','KN','LC','VC','WS','SM','ST','SA','SN','RS','SC','SL','SG','SK','SI','SB','SO','ZA','KR','SS',
    'ES','LK','SD','SR','SE','CH','SY','TJ','TZ','TH','TL','TG','TO','TT','TN','TR','TM','TV','UG','UA',
    'AE','GB','US','UY','UZ','VU','VE','VN','YE','ZM','ZW',
  ],

  'european-union': [
    'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL',
    'PL','PT','RO','SK','SI','ES','SE',
  ],

  'nato': [
    'AL','BE','BG','CA','HR','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IT','LV','LT','LU','ME','NL',
    'MK','NO','PL','PT','RO','SK','SI','ES','SE','TR','GB','US',
  ],

  'african-union': [
    'DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CG','CD','DJ','EG','GQ','ER','SZ','ET','GA',
    'GM','GH','GN','GW','CI','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW',
    'ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW',
  ],

  'asean': [
    'BN','KH','ID','LA','MY','MM','PH','SG','TH','VN',
  ],

  'arab-league': [
    'DZ','BH','KM','DJ','EG','IQ','JO','KW','LB','LY','MR','MA','OM','PS','QA','SA','SO','SD','SY','TN',
    'AE','YE',
  ],

  'organization-of-american-states': [
    'AG','AR','BS','BB','BZ','BO','BR','CA','CL','CO','CR','CU','DM','DO','EC','SV','GD','GT','GY','HT',
    'HN','JM','MX','NI','PA','PY','PE','KN','LC','VC','SR','TT','US','UY','VE',
  ],

  'commonwealth-of-nations': [
    'AG','AU','BS','BD','BB','BZ','BW','BN','CM','CA','CY','DM','SZ','FJ','GM','GH','GD','GY','IN','JM',
    'KE','KI','LS','MW','MY','MV','MT','MU','MZ','NA','NR','NZ','NG','PK','PG','RW','KN','LC','VC','WS',
    'SC','SL','SG','SB','ZA','LK','TZ','TO','TT','TV','UG','GB','VU','ZM',
  ],

  'organisation-of-islamic-cooperation': [
    'AF','AL','DZ','AZ','BH','BD','BJ','BN','BF','CM','TD','KM','CI','DJ','EG','GA','GM','GN','GW','GY',
    'ID','IR','IQ','JO','KZ','KW','KG','LB','LY','MY','MV','ML','MR','MA','MZ','NE','NG','OM','PK','PS',
    'QA','SA','SN','SL','SO','SD','SR','SY','TJ','TG','TN','TR','TM','UG','AE','UZ','YE',
  ],

  'opec': [
    'DZ','AO','CG','GQ','GA','IR','IQ','KW','LY','NG','SA','AE','VE',
  ],

  'gulf-cooperation-council': [
    'BH','KW','OM','QA','SA','AE',
  ],

  'nordic-council': [
    'DK','FI','IS','NO','SE',
  ],

  'pacific-community': [
    'AU','FJ','FM','KI','MH','NR','NZ','PG','PW','SB','TO','TV','VU','WS',
  ],

  'caribbean-community': [
    'AG','BS','BB','BZ','DM','GD','GY','HT','JM','KN','LC','VC','SR','TT',
  ],

  'union-of-south-american-nations': [
    'AR','BO','BR','CL','CO','EC','GY','PY','PE','SR','UY','VE',
  ],

  'commonwealth-of-independent-states': [
    'AM','AZ','BY','KZ','KG','MD','RU','TJ','UZ',
  ],

  'collective-security-treaty-organization': [
    'AM','BY','KZ','KG','RU','TJ',
  ],

  'eurasian-economic-union': [
    'AM','BY','KZ','KG','RU',
  ],

  'southern-african-development-community': [
    'AO','BW','CD','KM','SZ','LS','MG','MW','MU','MZ','NA','SC','ZA','TZ','ZM','ZW',
  ],

  'east-african-community': [
    'BI','CD','KE','RW','SS','TZ','UG','SO',
  ],

  'organisation-of-turkic-states': [
    'AZ','KZ','KG','TR','UZ','HU','TM',
  ],

  'central-american-integration-system': [
    'BZ','CR','DO','SV','GT','HN','NI','PA',
  ],

  'organisation-internationale-de-la-francophonie': [
    'AL','AD','AM','BE','BJ','BG','BF','BI','CM','CV','CF','TD','KM','CG','CD','CI','DJ','DM','EG','GQ',
    'FR','GA','GH','GN','GW','HT','KH','LB','LU','MG','ML','MA','MR','MU','MD','MC','MZ','NE','RO','RW',
    'ST','SN','SC','CH','TG','TN','VN','VU',
  ],
};
