// This file is used by ts-to-zod to generate Zod schemas
// Full type definitions extracted from yahoo-finance2 package
// DO NOT EDIT MANUALLY - Run 'pnpm extract:types' to regenerate
//
// Generated at: 2025-11-16T23:12:57.481Z

// QuoteSummaryResult and related types

type _DateInMs = number;

export interface QuoteSummaryResult {
  [key: string]: unknown;
  assetProfile?: AssetProfile;
  balanceSheetHistory?: BalanceSheetHistory;
  balanceSheetHistoryQuarterly?: BalanceSheetHistory;
  calendarEvents?: CalendarEvents;
  cashflowStatementHistory?: CashflowStatementHistory;
  cashflowStatementHistoryQuarterly?: CashflowStatementHistory;
  defaultKeyStatistics?: DefaultKeyStatistics;
  earnings?: QuoteSummaryEarnings;
  earningsHistory?: EarningsHistory;
  earningsTrend?: EarningsTrend;
  financialData?: FinancialData;
  fundOwnership?: Ownership;
  fundPerformance?: FundPerformance;
  fundProfile?: FundProfile;
  incomeStatementHistory?: IncomeStatementHistory;
  incomeStatementHistoryQuarterly?: IncomeStatementHistory;
  indexTrend?: IndexTrend;
  industryTrend?: Trend;
  insiderHolders?: Holders;
  insiderTransactions?: InsiderTransactions;
  institutionOwnership?: Ownership;
  majorDirectHolders?: Holders;
  majorHoldersBreakdown?: MajorHoldersBreakdown;
  netSharePurchaseActivity?: NetSharePurchaseActivity;
  price?: Price;
  quoteType?: QuoteType;
  recommendationTrend?: RecommendationTrend;
  secFilings?: SECFilings;
  sectorTrend?: Trend;
  summaryDetail?: SummaryDetail;
  summaryProfile?: SummaryProfile;
  topHoldings?: TopHoldings;
  upgradeDowngradeHistory?: UpgradeDowngradeHistory;
}
export interface AssetProfile {
  [key: string]: unknown;
  maxAge: number;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  fax?: string;
  website?: string;
  industry?: string;
  industryDisp?: string;
  industryKey?: string;
  industrySymbol?: string;
  sector?: string;
  sectorDisp?: string;
  sectorKey?: string;
  longBusinessSummary?: string;
  fullTimeEmployees?: number;
  companyOfficers: CompanyOfficer[];
  auditRisk?: number;
  boardRisk?: number;
  compensationRisk?: number;
  shareHolderRightsRisk?: number;
  overallRisk?: number;
  governanceEpochDate?: Date;
  compensationAsOfEpochDate?: Date;
  name?: string;
  startDate?: Date;
  description?: string;
  twitter?: string;
  irWebsite?: string;
  executiveTeam?: unknown[];
}
export interface CompanyOfficer {
  [key: string]: unknown;
  maxAge: number;
  name: string;
  age?: number;
  title: string;
  yearBorn?: number;
  fiscalYear?: number;
  totalPay?: number;
  exercisedValue?: number;
  unexercisedValue?: number;
}
export interface BalanceSheetHistory {
  [key: string]: unknown;
  balanceSheetStatements: BalanceSheetStatement[];
  maxAge: number;
}
export interface BalanceSheetStatement {
  maxAge: number;
  endDate: Date;
}
export interface CalendarEvents {
  [key: string]: unknown;
  maxAge: number;
  earnings: CalendarEventsEarnings;
  exDividendDate?: Date;
  dividendDate?: Date;
}
export interface CalendarEventsEarnings {
  [key: string]: unknown;
  earningsCallDate: Date[];
  isEarningsDateEstimate?: boolean;
  earningsDate: Date[];
  earningsAverage?: number;
  earningsLow?: number;
  earningsHigh?: number;
  revenueAverage?: number;
  revenueLow?: number;
  revenueHigh?: number;
}
export interface CashflowStatementHistory {
  cashflowStatements: CashflowStatement[];
  maxAge: number;
}
export interface CashflowStatement {
  maxAge: number;
  endDate: Date;
  netIncome: number;
}
export interface DefaultKeyStatistics {
  [key: string]: unknown;
  maxAge: number;
  priceHint: number;
  enterpriseValue?: number;
  forwardPE?: number;
  profitMargins?: number;
  floatShares?: number;
  sharesOutstanding?: number;
  sharesShort?: number;
  sharesShortPriorMonth?: Date;
  sharesShortPreviousMonthDate?: Date;
  dateShortInterest?: Date;
  sharesPercentSharesOut?: number;
  heldPercentInsiders?: number;
  heldPercentInstitutions?: number;
  shortRatio?: number;
  shortPercentOfFloat?: number;
  beta?: number;
  impliedSharesOutstanding?: number;
  category: null | string;
  bookValue?: number;
  priceToBook?: number;
  fundFamily: null | string;
  legalType: null | string;
  lastFiscalYearEnd?: Date;
  nextFiscalYearEnd?: Date;
  mostRecentQuarter?: Date;
  earningsQuarterlyGrowth?: number;
  netIncomeToCommon?: number;
  trailingEps?: number;
  forwardEps?: number;
  pegRatio?: number;
  lastSplitFactor: null | string;
  lastSplitDate?: number;
  enterpriseToRevenue?: number;
  enterpriseToEbitda?: number;
  "52WeekChange"?: number;
  SandP52WeekChange?: number;
  lastDividendValue?: number;
  lastDividendDate?: Date;
  ytdReturn?: number;
  beta3Year?: number;
  totalAssets?: number;
  yield?: number;
  fundInceptionDate?: Date;
  threeYearAverageReturn?: number;
  fiveYearAverageReturn?: number;
  morningStarOverallRating?: number;
  morningStarRiskRating?: number;
  annualReportExpenseRatio?: number;
  lastCapGain?: number;
  annualHoldingsTurnover?: number;
  latestShareClass?: unknown;
  leadInvestor?: unknown;
}
export interface QuoteSummaryEarnings {
  [key: string]: unknown;
  maxAge: number;
  earningsChart: EarningsChart;
  financialsChart: FinancialsChart;
  financialCurrency?: string;
}
export interface EarningsChart {
  [key: string]: unknown;
  quarterly: EarningsChartQuarterly[];
  currentQuarterEstimate?: number;
  currentQuarterEstimateDate?: string;
  currentQuarterEstimateYear?: number;
  earningsDate: Date[];
  isEarningsDateEstimate?: boolean;
}
export interface EarningsChartQuarterly {
  [key: string]: unknown;
  date: string;
  actual?: number;
  estimate: number;
}
export interface FinancialsChart {
  [key: string]: unknown;
  yearly: Yearly[];
  quarterly: FinancialsChartQuarterly[];
}
export interface FinancialsChartQuarterly {
  [key: string]: unknown;
  date: string;
  revenue: number;
  earnings: number;
}
export interface Yearly {
  [key: string]: unknown;
  date: number;
  revenue: number;
  earnings: number;
}
export interface EarningsHistory {
  [key: string]: unknown;
  history: EarningsHistoryHistory[];
  maxAge: number;
}
export interface EarningsHistoryHistory {
  [key: string]: unknown;
  maxAge: number;
  epsActual: number | null;
  epsEstimate: number | null;
  epsDifference: number | null;
  surprisePercent: number | null;
  quarter: Date | null;
  period: string;
  currency?: string;
}
export interface EarningsTrend {
  [key: string]: unknown;
  trend: EarningsTrendTrend[];
  maxAge: number;
}
export interface EarningsTrendTrend {
  [key: string]: unknown;
  maxAge: number;
  period: string;
  endDate: Date | null;
  growth: number | null;
  earningsEstimate: EarningsEstimate;
  revenueEstimate: RevenueEstimate;
  epsTrend: EpsTrend;
  epsRevisions: EpsRevisions;
}
export interface EarningsEstimate {
  [key: string]: unknown;
  avg: number | null;
  low: number | null;
  high: number | null;
  yearAgoEps: number | null;
  numberOfAnalysts: number | null;
  growth: number | null;
  earningsCurrency?: string | null;
}
export interface EpsRevisions {
  [key: string]: unknown;
  upLast7days?: number | null;
  upLast30days?: number | null;
  upLast90days?: number | null;
  downLast7Days?: number | null;
  downLast30days?: number | null;
  downLast90days?: number | null;
  epsRevisionsCurrency?: string | null;
}
export interface EpsTrend {
  [key: string]: unknown;
  current: number | null;
  "7daysAgo": number | null;
  "30daysAgo": number | null;
  "60daysAgo": number | null;
  "90daysAgo": number | null;
  epsTrendCurrency?: string | null;
}
export interface RevenueEstimate {
  [key: string]: unknown;
  avg: number | null;
  low: number | null;
  high: number | null;
  numberOfAnalysts: number | null;
  yearAgoRevenue: number | null;
  growth: number | null;
  revenueCurrency?: string | null;
}
export interface FinancialData {
  [key: string]: unknown;
  maxAge: number;
  currentPrice?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  targetMeanPrice?: number;
  targetMedianPrice?: number;
  recommendationMean?: number;
  recommendationKey: string;
  numberOfAnalystOpinions?: number;
  totalCash?: number;
  totalCashPerShare?: number;
  ebitda?: number;
  totalDebt?: number;
  quickRatio?: number;
  currentRatio?: number;
  totalRevenue?: number;
  debtToEquity?: number;
  revenuePerShare?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;
  grossProfits?: number;
  freeCashflow?: number;
  operatingCashflow?: number;
  earningsGrowth?: number;
  revenueGrowth?: number;
  grossMargins?: number;
  ebitdaMargins?: number;
  operatingMargins?: number;
  profitMargins?: number;
  financialCurrency: string | null;
}
export interface Ownership {
  [key: string]: unknown;
  maxAge: number;
  ownershipList: OwnershipList[];
}
export interface OwnershipList {
  [key: string]: unknown;
  maxAge: number;
  reportDate: Date;
  organization: string;
  pctHeld: number;
  position: number;
  value: number;
  pctChange?: number;
}
export interface FundPerformance {
  [key: string]: unknown;
  maxAge: number;
  loadAdjustedReturns?: PeriodRange;
  rankInCategory?: PeriodRange;
  performanceOverview: FundPerformancePerformanceOverview;
  performanceOverviewCat: FundPerformancePerformanceOverviewCat;
  trailingReturns: FundPerformanceTrailingReturns;
  trailingReturnsNav: FundPerformanceTrailingReturns;
  trailingReturnsCat: FundPerformanceTrailingReturns;
  annualTotalReturns: FundPerformanceReturns;
  pastQuarterlyReturns: FundPerformanceReturns;
  riskOverviewStatistics: FundPerformanceRiskOverviewStats;
  riskOverviewStatisticsCat: FundPerformanceRiskOverviewStatsCat;
  fundCategoryName?: string;
}
export interface PeriodRange {
  [key: string]: unknown;
  asOfDate?: Date;
  ytd?: number;
  oneMonth?: number;
  threeMonth?: number;
  oneYear?: number;
  threeYear?: number;
  fiveYear?: number;
  tenYear?: number;
}
export interface FundPerformanceTrailingReturns {
  [key: string]: unknown;
  asOfDate?: Date;
  ytd?: number;
  oneMonth?: number;
  threeMonth?: number;
  oneYear?: number;
  threeYear?: number;
  fiveYear?: number;
  tenYear?: number;
  lastBullMkt?: number;
  lastBearMkt?: number;
}
export interface FundPerformancePerformanceOverview {
  [key: string]: unknown;
  asOfDate?: Date;
  ytdReturnPct?: number;
  oneYearTotalReturn?: number;
  threeYearTotalReturn?: number;
  fiveYrAvgReturnPct?: number;
  morningStarReturnRating?: number;
  numYearsUp?: number;
  numYearsDown?: number;
  bestOneYrTotalReturn?: number;
  worstOneYrTotalReturn?: number;
  bestThreeYrTotalReturn?: number;
  worstThreeYrTotalReturn?: number;
}
export interface FundPerformancePerformanceOverviewCat {
  [key: string]: unknown;
  ytdReturnPct?: number;
  fiveYrAvgReturnPct?: number;
  oneYearTotalReturn?: number;
  threeYearTotalReturn?: number;
}
export interface FundPerformanceReturns {
  [key: string]: unknown;
  returns: FundPerformanceReturnsRow[];
  returnsCat?: FundPerformanceReturnsRow[];
}
export interface FundPerformanceReturnsRow {
  [key: string]: unknown;
  year: number;
  annualValue?: number;
  q1?: number;
  q2?: number;
  q3?: number;
  q4?: number;
}
export interface FundPerformanceRiskOverviewStats {
  [key: string]: unknown;
  riskStatistics: FundPerformanceRiskOverviewStatsRow[];
  riskRating?: number;
}
export interface FundPerformanceRiskOverviewStatsCat {
  [key: string]: unknown;
  riskStatisticsCat: FundPerformanceRiskOverviewStatsRow[];
}
export interface FundPerformanceRiskOverviewStatsRow {
  [key: string]: unknown;
  year: string;
  alpha: number;
  beta: number;
  meanAnnualReturn: number;
  rSquared: number;
  stdDev?: number;
  sharpeRatio: number;
  treynorRatio: number;
}
export interface FundProfile {
  [key: string]: unknown;
  maxAge: number;
  styleBoxUrl?: null | string;
  family: null | string;
  categoryName: null | string;
  legalType: null | string;
  managementInfo?: FundProfileManagementInfo;
  feesExpensesInvestment?: FundProfileFeesExpensesInvestment;
  feesExpensesInvestmentCat?: FundProfileFeesExpensesInvestmentCat;
  brokerages?: FundProfileBrokerage[];
  initInvestment?: number;
  initIraInvestment?: number;
  initAipInvestment?: number;
  subseqInvestment?: number;
  subseqIraInvestment?: number;
  subseqAipInvestment?: number;
}
export interface FundProfileManagementInfo {
  [key: string]: unknown;
  managerName: null | string;
  managerBio: null | string;
  startdate?: Date;
}
export interface FundProfileFeesExpensesInvestment {
  [key: string]: unknown;
  annualHoldingsTurnover?: number;
  annualReportExpenseRatio?: number;
  grossExpRatio?: number;
  netExpRatio?: number;
  projectionValues: object;
  totalNetAssets?: number;
}
export interface FundProfileFeesExpensesInvestmentCat
  extends Record<string, unknown> {
  projectionValuesCat: object;
}
export interface FundProfileBrokerage {
  [key: string]: unknown;
}
export interface IncomeStatementHistory {
  [key: string]: unknown;
  incomeStatementHistory: IncomeStatementHistoryElement[];
  maxAge: number;
}
export interface IncomeStatementHistoryElement {
  maxAge: number;
  endDate: Date;
  totalRevenue: number;
  costOfRevenue: number;
  grossProfit: number;
  researchDevelopment: null;
  sellingGeneralAdministrative: null;
  nonRecurring: null;
  otherOperatingExpenses: null;
  totalOperatingExpenses: number;
  operatingIncome: null;
  totalOtherIncomeExpenseNet: null;
  ebit: number;
  interestExpense: null;
  incomeBeforeTax: null;
  incomeTaxExpense: number;
  minorityInterest: null;
  netIncomeFromContinuingOps: null;
  discontinuedOperations: null;
  extraordinaryItems: null;
  effectOfAccountingCharges: null;
  otherItems: null;
  netIncome: number;
  netIncomeApplicableToCommonShares: null;
}
export interface IndexTrend {
  [key: string]: unknown;
  maxAge: number;
  symbol: string;
  peRatio?: number;
  pegRatio?: number;
  estimates: Estimate[];
}
export interface Estimate {
  [key: string]: unknown;
  period: string;
  growth?: number;
}
export interface Trend {
  [key: string]: unknown;
  maxAge: number;
  symbol: null;
  estimates: unknown[];
}
export interface Holders {
  [key: string]: unknown;
  holders: Holder[];
  maxAge: number;
}
export interface Holder {
  [key: string]: unknown;
  maxAge: number;
  name: string;
  relation: Relation | string;
  url: string;
  transactionDescription: string;
  latestTransDate: Date;
  positionDirect?: number;
  positionDirectDate?: Date;
  positionIndirect?: number;
  positionIndirectDate?: Date;
  positionSummaryDate?: Date;
}
export declare enum Relation {
  ChairmanOfTheBoard = "Chairman of the Board",
  ChiefExecutiveOfficer = "Chief Executive Officer",
  ChiefFinancialOfficer = "Chief Financial Officer",
  ChiefOperatingOfficer = "Chief Operating Officer",
  ChiefTechnologyOfficer = "Chief Technology Officer",
  Director = "Director",
  DirectorIndependent = "Director (Independent)",
  Empty = "",
  GeneralCounsel = "General Counsel",
  IndependentNonExecutiveDirector = "Independent Non-Executive Director",
  Officer = "Officer",
  President = "President",
}
export interface InsiderTransactions {
  [key: string]: unknown;
  transactions: Transaction[];
  maxAge: number;
}
export interface Transaction {
  [key: string]: unknown;
  maxAge: number;
  shares: number;
  filerUrl: string;
  transactionText: string;
  filerName: string;
  filerRelation: Relation | string;
  moneyText: string;
  startDate: Date;
  ownership: OwnershipEnum | string;
  value?: number;
}
export declare enum OwnershipEnum {
  D = "D",
  I = "I",
}
export interface MajorHoldersBreakdown {
  [key: string]: unknown;
  maxAge: number;
  insidersPercentHeld?: number;
  institutionsPercentHeld?: number;
  institutionsFloatPercentHeld?: number;
  institutionsCount?: number;
}
export interface NetSharePurchaseActivity {
  [key: string]: unknown;
  maxAge: number;
  period: string;
  buyInfoCount: number;
  buyInfoShares: number;
  buyPercentInsiderShares?: number;
  sellInfoCount: number;
  sellInfoShares?: number;
  sellPercentInsiderShares?: number;
  netInfoCount: number;
  netInfoShares: number;
  netPercentInsiderShares?: number;
  totalInsiderShares: number;
}
export interface Price {
  [key: string]: unknown;
  averageDailyVolume10Day?: number;
  averageDailyVolume3Month?: number;
  exchange?: string;
  exchangeName?: string;
  exchangeDataDelayedBy?: number;
  maxAge: number;
  postMarketChangePercent?: number;
  postMarketChange?: number;
  postMarketTime?: Date;
  postMarketPrice?: number;
  postMarketSource?: string;
  preMarketChangePercent?: number;
  preMarketChange?: number;
  preMarketTime?: Date;
  preMarketPrice?: number;
  preMarketSource?: string;
  priceHint: number;
  regularMarketChangePercent?: number;
  regularMarketChange?: number;
  regularMarketTime?: Date;
  regularMarketPrice?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketPreviousClose?: number;
  regularMarketSource?: string;
  regularMarketOpen?: number;
  quoteSourceName?: string;
  quoteType: string;
  symbol: string;
  underlyingSymbol: null | string;
  shortName: null | string;
  longName: null | string;
  lastMarket: null | string;
  marketState?: string;
  marketCap?: number;
  currency?: string;
  currencySymbol?: string;
  fromCurrency: string | null;
  toCurrency?: string | null;
  volume24Hr?: number;
  volumeAllCurrencies?: number;
  circulatingSupply?: number;
  expireDate?: Date;
  openInterest?: number;
}
export interface QuoteType {
  [key: string]: unknown;
  exchange: string;
  quoteType: string;
  symbol: string;
  underlyingSymbol: string;
  shortName: null | string;
  longName?: null | string;
  firstTradeDateEpochUtc?: null | Date;
  timeZoneFullName: string;
  timeZoneShortName: string;
  uuid: string;
  messageBoardId?: null | string;
  gmtOffSetMilliseconds: number;
  maxAge: number;
}
export interface RecommendationTrend {
  [key: string]: unknown;
  trend: RecommendationTrendTrend[];
  maxAge: number;
}
export interface RecommendationTrendTrend {
  [key: string]: unknown;
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}
export interface SECFilings {
  [key: string]: unknown;
  filings: Filing[];
  maxAge: number;
}
export interface Filing {
  [key: string]: unknown;
  date: string;
  epochDate: Date;
  type: FilingType;
  title: string;
  edgarUrl: string;
  maxAge: number;
  url?: string;
  exhibits?: {
    type: string;
    url: string;
    downloadUrl?: string;
  }[];
}
type FilingType =
  | "10-K"
  | "10-Q"
  | "8-K"
  | "8-K/A"
  | "10-K/A"
  | "10-Q/A"
  | "SD"
  | "PX14A6G"
  | "SC 13G/A"
  | "DEFA14A"
  | "25-NSE"
  | "S-8 POS"
  | "6-K"
  | "F-3ASR"
  | "SC 13D/A"
  | "20-F"
  | "425"
  | "SC14D9C"
  | "SC 13G"
  | "S-8"
  | "DEF 14A"
  | "F-10"
  | "S-3ASR"
  | "CORRESP"
  | "PX14A6N"
  | "N-PX"
  | "ARS"
  | "PRE 14A"
  | "F-6EF"
  | "S-3/A"
  | "S-3"
  | "POS AM"
  | "IRANNOTICE"
  | "20-F/A"
  | "11-K"
  | "DEFR14A";
export interface SummaryDetail {
  [key: string]: unknown;
  maxAge: number;
  priceHint: number;
  previousClose?: number;
  open?: number;
  dayLow?: number;
  dayHigh?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketDayLow?: number;
  regularMarketDayHigh?: number;
  regularMarketVolume?: number;
  dividendRate?: number;
  dividendYield?: number;
  exDividendDate?: Date;
  payoutRatio?: number;
  fiveYearAvgDividendYield?: number;
  beta?: number;
  trailingPE?: number;
  forwardPE?: number;
  volume?: number;
  averageVolume?: number;
  averageVolume10days?: number;
  averageDailyVolume10Day?: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  marketCap?: number;
  fiftyDayAverage?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  twoHundredDayAverage?: number;
  priceToSalesTrailing12Months?: number;
  trailingAnnualDividendRate?: number;
  trailingAnnualDividendYield?: number;
  currency: string;
  algorithm: null;
  tradeable: boolean;
  yield?: number;
  totalAssets?: number;
  navPrice?: number;
  ytdReturn?: number;
  fromCurrency: string | null;
  toCurrency?: string | null;
  lastMarket: string | null;
  volume24Hr?: number;
  volumeAllCurrencies?: number;
  circulatingSupply?: number;
  startDate?: Date;
  coinMarketCapLink?: string | null;
  expireDate?: Date;
  openInterest?: number;
  averageMaturity?: number;
}
export interface SummaryProfile {
  [key: string]: unknown;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  fax?: string;
  website?: string;
  industry?: string;
  industryDisp?: string;
  sector?: string;
  sectorDisp?: string;
  longBusinessSummary?: string;
  fullTimeEmployees?: number;
  companyOfficers: unknown[];
  maxAge: number;
  twitter?: string;
  industryKey?: string;
  sectorKey?: string;
  irWebsite?: string;
  executiveTeam?: unknown[];
  name?: string;
  startDate?: Date;
  description?: string;
}
export interface TopHoldings {
  [key: string]: unknown;
  maxAge: number;
  stockPosition?: number;
  bondPosition?: number;
  holdings: TopHoldingsHolding[];
  equityHoldings: TopHoldingsEquityHoldings;
  bondHoldings: object;
  bondRatings: TopHoldingsBondRating[];
  sectorWeightings: TopHoldingsSectorWeighting[];
  cashPosition?: number;
  otherPosition?: number;
  preferredPosition?: number;
  convertiblePosition?: number;
}
export interface TopHoldingsHolding {
  [key: string]: unknown;
  symbol: string;
  holdingName: string;
  holdingPercent: number;
}
export interface TopHoldingsEquityHoldings {
  [key: string]: unknown;
  medianMarketCap?: number;
  medianMarketCapCat?: number;
  priceToBook: number;
  priceToBookCat?: number;
  priceToCashflow: number;
  priceToCashflowCat?: number;
  priceToEarnings: number;
  priceToEarningsCat?: number;
  priceToSales: number;
  priceToSalesCat?: number;
  threeYearEarningsGrowth?: number;
  threeYearEarningsGrowthCat?: number;
}
export interface TopHoldingsBondRating {
  [key: string]: unknown;
  a?: number;
  aa?: number;
  aaa?: number;
  other?: number;
  b?: number;
  bb?: number;
  bbb?: number;
  below_b?: number;
  us_government?: number;
}
export interface TopHoldingsSectorWeighting {
  [key: string]: unknown;
  realestate?: number;
  consumer_cyclical?: number;
  basic_materials?: number;
  consumer_defensive?: number;
  technology?: number;
  communication_services?: number;
  financial_services?: number;
  utilities?: number;
  industrials?: number;
  energy?: number;
  healthcare?: number;
}
export interface UpgradeDowngradeHistory {
  [key: string]: unknown;
  history: UpgradeDowngradeHistoryHistory[];
  maxAge: number;
}
export interface UpgradeDowngradeHistoryHistory {
  [key: string]: unknown;
  epochGradeDate: Date;
  firm: string;
  toGrade: Grade;
  fromGrade?: Grade;
  action: Action;
}
export declare enum Action {
  Down = "down",
  Init = "init",
  Main = "main",
  Reit = "reit",
  Up = "up",
}
export declare enum Grade {
  Accumulate = "Accumulate",
  Add = "Add",
  Average = "Average",
  BelowAverage = "Below Average",
  Buy = "Buy",
  ConvictionBuy = "Conviction Buy",
  Empty = "",
  EqualWeight = "Equal-Weight",
  FairValue = "Fair Value",
  GradeEqualWeight = "Equal-weight",
  GradeLongTermBuy = "Long-term Buy",
  Hold = "Hold",
  LongTermBuy = "Long-Term Buy",
  MarketOutperform = "Market Outperform",
  MarketPerform = "Market Perform",
  Mixed = "Mixed",
  Negative = "Negative",
  Neutral = "Neutral",
  InLine = "In-Line",
  Outperform = "Outperform",
  Overweight = "Overweight",
  PeerPerform = "Peer Perform",
  Perform = "Perform",
  Positive = "Positive",
  Reduce = "Reduce",
  SectorOutperform = "Sector Outperform",
  SectorPerform = "Sector Perform",
  SectorWeight = "Sector Weight",
  Sell = "Sell",
  StrongBuy = "Strong Buy",
  TopPick = "Top Pick",
  Underperform = "Underperform",
  Underperformer = "Underperformer",
  Underweight = "Underweight",
  Trim = "Trim",
  AboveAverage = "Above Average",
  Inline = "In-line",
  Outperformer = "Outperformer",
  OVerweight = "OVerweight", // Not a typo, how it was returned from API
  Cautious = "Cautious",
  MarketWeight = "Market Weight",
  SectorUnderperform = "Sector Underperform",
  MarketUnderperform = "Market Underperform",
  Peerperform = "Peer perform",
  GraduallyAccumulate = "Gradually Accumulate",
  ActionListBuy = "Action List Buy",
  Performer = "Performer",
  SectorPerformer = "Sector Performer",
  SpeculativeBuy = "Speculative Buy",
  StrongSell = "Strong Sell",
  SpeculativeHold = "Speculative Hold",
  NotRated = "Not Rated",
  HoldNeutral = "Hold Neutral",
  Developing = "Developing",
  buy = "buy",
  HOld = "HOld", // Not a typo, how it was returned from API
  TradingSell = "Trading Sell",
  Tender = "Tender",
  marketperform = "market perform",
  BUy = "BUy",
}
export {};

// InsightsResult and related types

// FundamentalsTimeSeriesResult and related types
export type FundamentalsTimeSeries_Period = "3M" | "12M";

export interface FundamentalsTimeSeriesFinancialsResult {
  date: Date;
  TYPE: "FINANCIALS";
  periodType: FundamentalsTimeSeries_Period;
  totalRevenue?: number;
  operatingRevenue?: number;
  costOfRevenue?: number;
  grossProfit?: number;
  sellingGeneralAndAdministration?: number;
  sellingAndMarketingExpense?: number;
  generalAndAdministrativeExpense?: number;
  otherGandA?: number;
  researchAndDevelopment?: number;
  depreciationAmortizationDepletionIncomeStatement?: number;
  depletionIncomeStatement?: number;
  depreciationAndAmortizationInIncomeStatement?: number;
  amortization?: number;
  amortizationOfIntangiblesIncomeStatement?: number;
  depreciationIncomeStatement?: number;
  otherOperatingExpenses?: number;
  operatingExpense?: number;
  operatingIncome?: number;
  interestExpenseNonOperating?: number;
  interestIncomeNonOperating?: number;
  totalOtherFinanceCost?: number;
  netNonOperatingInterestIncomeExpense?: number;
  writeOff?: number;
  specialIncomeCharges?: number;
  gainOnSaleOfPPE?: number;
  gainOnSaleOfBusiness?: number;
  gainOnSaleOfSecurity?: number;
  otherSpecialCharges?: number;
  otherIncomeExpense?: number;
  otherNonOperatingIncomeExpenses?: number;
  totalExpenses?: number;
  pretaxIncome?: number;
  taxProvision?: number;
  netIncomeContinuousOperations?: number;
  netIncomeIncludingNoncontrollingInterests?: number;
  minorityInterests?: number;
  netIncomeFromTaxLossCarryforward?: number;
  netIncomeExtraordinary?: number;
  netIncomeDiscontinuousOperations?: number;
  preferredStockDividends?: number;
  otherunderPreferredStockDividend?: number;
  netIncomeCommonStockholders?: number;
  netIncome?: number;
  basicAverageShares?: number;
  dilutedAverageShares?: number;
  dividendPerShare?: number;
  reportedNormalizedBasicEPS?: number;
  continuingAndDiscontinuedBasicEPS?: number;
  basicEPSOtherGainsLosses?: number;
  taxLossCarryforwardBasicEPS?: number;
  normalizedBasicEPS?: number;
  basicEPS?: number;
  basicAccountingChange?: number;
  basicExtraordinary?: number;
  basicDiscontinuousOperations?: number;
  basicContinuousOperations?: number;
  reportedNormalizedDilutedEPS?: number;
  continuingAndDiscontinuedDilutedEPS?: number;
  taxLossCarryforwardDilutedEPS?: number;
  averageDilutionEarnings?: number;
  normalizedDilutedEPS?: number;
  dilutedEPS?: number;
  dilutedAccountingChange?: number;
  dilutedExtraordinary?: number;
  dilutedContinuousOperations?: number;
  dilutedDiscontinuousOperations?: number;
  dilutedNIAvailtoComStockholders?: number;
  dilutedEPSOtherGainsLosses?: number;
  totalOperatingIncomeAsReported?: number;
  netIncomeFromContinuingAndDiscontinuedOperation?: number;
  normalizedIncome?: number;
  netInterestIncome?: number;
  EBIT?: number;
  EBITDA?: number;
  reconciledCostOfRevenue?: number;
  reconciledDepreciation?: number;
  netIncomeFromContinuingOperationNetMinorityInterest?: number;
  totalUnusualItemsExcludingGoodwill?: number;
  totalUnusualItems?: number;
  normalizedEBITDA?: number;
  taxRateForCalcs?: number;
  taxEffectOfUnusualItems?: number;
  rentExpenseSupplemental?: number;
  earningsFromEquityInterestNetOfTax?: number;
  impairmentOfCapitalAssets?: number;
  restructuringAndMergernAcquisition?: number;
  securitiesAmortization?: number;
  earningsFromEquityInterest?: number;
  otherTaxes?: number;
  provisionForDoubtfulAccounts?: number;
  insuranceAndClaims?: number;
  rentAndLandingFees?: number;
  salariesAndWages?: number;
  exciseTaxes?: number;
  interestExpense?: number;
  interestIncome?: number;
  totalMoneyMarketInvestments?: number;
  interestIncomeAfterProvisionForLoanLoss?: number;
  otherThanPreferredStockDividend?: number;
  lossonExtinguishmentofDebt?: number;
  incomefromAssociatesandOtherParticipatingInterests?: number;
  nonInterestExpense?: number;
  otherNonInterestExpense?: number;
  professionalExpenseAndContractServicesExpense?: number;
  occupancyAndEquipment?: number;
  equipment?: number;
  netOccupancyExpense?: number;
  creditLossesProvision?: number;
  nonInterestIncome?: number;
  otherNonInterestIncome?: number;
  gainLossonSaleofAssets?: number;
  gainonSaleofInvestmentProperty?: number;
  gainonSaleofLoans?: number;
  foreignExchangeTradingGains?: number;
  tradingGainLoss?: number;
  investmentBankingProfit?: number;
  dividendIncome?: number;
  feesAndCommissions?: number;
  feesandCommissionExpense?: number;
  feesandCommissionIncome?: number;
  otherCustomerServices?: number;
  creditCard?: number;
  securitiesActivities?: number;
  trustFeesbyCommissions?: number;
  serviceChargeOnDepositorAccounts?: number;
  totalPremiumsEarned?: number;
  otherInterestExpense?: number;
  interestExpenseForFederalFundsSoldAndSecuritiesPurchaseUnderAgreementsToResell?: number;
  interestExpenseForLongTermDebtAndCapitalSecurities?: number;
  interestExpenseForShortTermDebt?: number;
  interestExpenseForDeposit?: number;
  otherInterestIncome?: number;
  interestIncomeFromFederalFundsSoldAndSecuritiesPurchaseUnderAgreementsToResell?: number;
  interestIncomeFromDeposits?: number;
  interestIncomeFromSecurities?: number;
  interestIncomeFromLoansAndLease?: number;
  interestIncomeFromLeases?: number;
  interestIncomeFromLoans?: number;
  depreciationDepreciationIncomeStatement?: number;
  operationAndMaintenance?: number;
  otherCostofRevenue?: number;
  explorationDevelopmentAndMineralPropertyLeaseExpenses?: number;
}
export interface FundamentalsTimeSeriesBalanceSheetResult {
  date: Date;
  TYPE: "BALANCE_SHEET";
  periodType: FundamentalsTimeSeries_Period;
  netDebt?: number;
  treasurySharesNumber?: number;
  preferredSharesNumber?: number;
  ordinarySharesNumber?: number;
  shareIssued?: number;
  totalDebt?: number;
  tangibleBookValue?: number;
  investedCapital?: number;
  workingCapital?: number;
  netTangibleAssets?: number;
  capitalLeaseObligations?: number;
  commonStockEquity?: number;
  preferredStockEquity?: number;
  totalCapitalization?: number;
  totalEquityGrossMinorityInterest?: number;
  minorityInterest?: number;
  stockholdersEquity?: number;
  otherEquityInterest?: number;
  gainsLossesNotAffectingRetainedEarnings?: number;
  otherEquityAdjustments?: number;
  fixedAssetsRevaluationReserve?: number;
  foreignCurrencyTranslationAdjustments?: number;
  minimumPensionLiabilities?: number;
  unrealizedGainLoss?: number;
  treasuryStock?: number;
  retainedEarnings?: number;
  additionalPaidInCapital?: number;
  capitalStock?: number;
  otherCapitalStock?: number;
  commonStock?: number;
  preferredStock?: number;
  totalPartnershipCapital?: number;
  generalPartnershipCapital?: number;
  limitedPartnershipCapital?: number;
  totalLiabilitiesNetMinorityInterest?: number;
  totalNonCurrentLiabilitiesNetMinorityInterest?: number;
  otherNonCurrentLiabilities?: number;
  liabilitiesHeldforSaleNonCurrent?: number;
  restrictedCommonStock?: number;
  preferredSecuritiesOutsideStockEquity?: number;
  derivativeProductLiabilities?: number;
  employeeBenefits?: number;
  nonCurrentPensionAndOtherPostretirementBenefitPlans?: number;
  nonCurrentAccruedExpenses?: number;
  duetoRelatedPartiesNonCurrent?: number;
  tradeandOtherPayablesNonCurrent?: number;
  nonCurrentDeferredLiabilities?: number;
  nonCurrentDeferredRevenue?: number;
  nonCurrentDeferredTaxesLiabilities?: number;
  longTermDebtAndCapitalLeaseObligation?: number;
  longTermCapitalLeaseObligation?: number;
  longTermDebt?: number;
  longTermProvisions?: number;
  currentLiabilities?: number;
  otherCurrentLiabilities?: number;
  currentDeferredLiabilities?: number;
  currentDeferredRevenue?: number;
  currentDeferredTaxesLiabilities?: number;
  currentDebtAndCapitalLeaseObligation?: number;
  currentCapitalLeaseObligation?: number;
  currentDebt?: number;
  otherCurrentBorrowings?: number;
  lineOfCredit?: number;
  commercialPaper?: number;
  currentNotesPayable?: number;
  pensionandOtherPostRetirementBenefitPlansCurrent?: number;
  currentProvisions?: number;
  payablesAndAccruedExpenses?: number;
  currentAccruedExpenses?: number;
  interestPayable?: number;
  payables?: number;
  otherPayable?: number;
  duetoRelatedPartiesCurrent?: number;
  dividendsPayable?: number;
  totalTaxPayable?: number;
  incomeTaxPayable?: number;
  accountsPayable?: number;
  totalAssets?: number;
  totalNonCurrentAssets?: number;
  otherNonCurrentAssets?: number;
  definedPensionBenefit?: number;
  nonCurrentPrepaidAssets?: number;
  nonCurrentDeferredAssets?: number;
  nonCurrentDeferredTaxesAssets?: number;
  duefromRelatedPartiesNonCurrent?: number;
  nonCurrentNoteReceivables?: number;
  nonCurrentAccountsReceivable?: number;
  financialAssets?: number;
  investmentsAndAdvances?: number;
  otherInvestments?: number;
  investmentinFinancialAssets?: number;
  heldToMaturitySecurities?: number;
  availableForSaleSecurities?: number;
  financialAssetsDesignatedasFairValueThroughProfitorLossTotal?: number;
  tradingSecurities?: number;
  longTermEquityInvestment?: number;
  investmentsinJointVenturesatCost?: number;
  investmentsInOtherVenturesUnderEquityMethod?: number;
  investmentsinAssociatesatCost?: number;
  investmentsinSubsidiariesatCost?: number;
  investmentProperties?: number;
  goodwillAndOtherIntangibleAssets?: number;
  otherIntangibleAssets?: number;
  goodwill?: number;
  netPPE?: number;
  accumulatedDepreciation?: number;
  grossPPE?: number;
  leases?: number;
  constructionInProgress?: number;
  otherProperties?: number;
  machineryFurnitureEquipment?: number;
  buildingsAndImprovements?: number;
  landAndImprovements?: number;
  properties?: number;
  currentAssets?: number;
  otherCurrentAssets?: number;
  hedgingAssetsCurrent?: number;
  assetsHeldForSaleCurrent?: number;
  currentDeferredAssets?: number;
  currentDeferredTaxesAssets?: number;
  restrictedCash?: number;
  prepaidAssets?: number;
  inventory?: number;
  inventoriesAdjustmentsAllowances?: number;
  otherInventories?: number;
  finishedGoods?: number;
  workInProcess?: number;
  rawMaterials?: number;
  receivables?: number;
  receivablesAdjustmentsAllowances?: number;
  otherReceivables?: number;
  duefromRelatedPartiesCurrent?: number;
  taxesReceivable?: number;
  accruedInterestReceivable?: number;
  notesReceivable?: number;
  loansReceivable?: number;
  accountsReceivable?: number;
  allowanceForDoubtfulAccountsReceivable?: number;
  grossAccountsReceivable?: number;
  cashCashEquivalentsAndShortTermInvestments?: number;
  otherShortTermInvestments?: number;
  cashAndCashEquivalents?: number;
  cashEquivalents?: number;
  cashFinancial?: number;
  otherLiabilities?: number;
  liabilitiesOfDiscontinuedOperations?: number;
  subordinatedLiabilities?: number;
  advanceFromFederalHomeLoanBanks?: number;
  tradingLiabilities?: number;
  duetoRelatedParties?: number;
  securitiesLoaned?: number;
  federalFundsPurchasedAndSecuritiesSoldUnderAgreementToRepurchase?: number;
  financialInstrumentsSoldUnderAgreementsToRepurchase?: number;
  federalFundsPurchased?: number;
  totalDeposits?: number;
  nonInterestBearingDeposits?: number;
  interestBearingDepositsLiabilities?: number;
  customerAccounts?: number;
  depositsbyBank?: number;
  otherAssets?: number;
  assetsHeldForSale?: number;
  deferredAssets?: number;
  deferredTaxAssets?: number;
  dueFromRelatedParties?: number;
  allowanceForNotesReceivable?: number;
  grossNotesReceivable?: number;
  netLoan?: number;
  unearnedIncome?: number;
  allowanceForLoansAndLeaseLosses?: number;
  grossLoan?: number;
  otherLoanAssets?: number;
  mortgageLoan?: number;
  consumerLoan?: number;
  commercialLoan?: number;
  loansHeldForSale?: number;
  derivativeAssets?: number;
  securitiesAndInvestments?: number;
  bankOwnedLifeInsurance?: number;
  otherRealEstateOwned?: number;
  foreclosedAssets?: number;
  customerAcceptances?: number;
  federalHomeLoanBankStock?: number;
  securityBorrowed?: number;
  cashCashEquivalentsAndFederalFundsSold?: number;
  moneyMarketInvestments?: number;
  federalFundsSoldAndSecuritiesPurchaseUnderAgreementsToResell?: number;
  securityAgreeToBeResell?: number;
  federalFundsSold?: number;
  restrictedCashAndInvestments?: number;
  restrictedInvestments?: number;
  restrictedCashAndCashEquivalents?: number;
  interestBearingDepositsAssets?: number;
  cashAndDueFromBanks?: number;
  bankIndebtedness?: number;
  mineralProperties?: number;
  netPPEPurchaseAndSale?: number;
  purchaseOfInvestment?: number;
  investingCashFlow?: number;
  grossProfit?: number;
  cashFlowFromContinuingOperatingActivities?: number;
  endCashPosition?: number;
  netIncomeCommonStockholders?: number;
  changeInAccountPayable?: number;
  otherNonCashItems?: number;
  cashDividendsPaid?: number;
  dilutedAverageShares?: number;
  repurchaseOfCapitalStock?: number;
  EBITDA?: number;
  stockBasedCompensation?: number;
  commonStockDividendPaid?: number;
  changeInPayable?: number;
  costOfRevenue?: number;
  operatingExpense?: number;
  changeInInventory?: number;
  normalizedIncome?: number;
  netIncomeIncludingNoncontrollingInterests?: number;
  netIncomeFromContinuingOperationNetMinorityInterest?: number;
  reconciledCostOfRevenue?: number;
  otherIncomeExpense?: number;
  netInvestmentPurchaseAndSale?: number;
  purchaseOfPPE?: number;
  taxProvision?: number;
  pretaxIncome?: number;
  researchAndDevelopment?: number;
  longTermDebtPayments?: number;
  changeInReceivables?: number;
  dilutedEPS?: number;
  netIssuancePaymentsOfDebt?: number;
  netShortTermDebtIssuance?: number;
  depreciationAndAmortization?: number;
  cashFlowFromContinuingInvestingActivities?: number;
  beginningCashPosition?: number;
  changesInCash?: number;
  financingCashFlow?: number;
  changeInOtherCurrentLiabilities?: number;
  changeInWorkingCapital?: number;
  operatingIncome?: number;
  totalRevenue?: number;
  netIncomeFromContinuingAndDiscontinuedOperation?: number;
  operatingRevenue?: number;
  changeInPayablesAndAccruedExpense?: number;
  netCommonStockIssuance?: number;
  commonStockPayments?: number;
  EBIT?: number;
  netOtherInvestingChanges?: number;
  basicEPS?: number;
  shortTermDebtPayments?: number;
  sellingGeneralAndAdministration?: number;
  netIncomeContinuousOperations?: number;
  repaymentOfDebt?: number;
  totalOperatingIncomeAsReported?: number;
  normalizedEBITDA?: number;
  capitalExpenditure?: number;
  cashFlowFromContinuingFinancingActivities?: number;
  netIncome?: number;
  netOtherFinancingCharges?: number;
  basicAverageShares?: number;
  netLongTermDebtIssuance?: number;
  depreciationAmortizationDepletion?: number;
  operatingCashFlow?: number;
  dilutedNIAvailtoComStockholders?: number;
  netIncomeFromContinuingOperations?: number;
  taxRateForCalcs?: number;
  freeCashFlow?: number;
  otherNonOperatingIncomeExpenses?: number;
  changesInAccountReceivables?: number;
  totalExpenses?: number;
  changeInOtherCurrentAssets?: number;
  reconciledDepreciation?: number;
  incomeTaxPaidSupplementalData?: number;
  saleOfInvestment?: number;
  interestPaidSupplementalData?: number;
  deferredTax?: number;
  changeInOtherWorkingCapital?: number;
  interestIncomeNonOperating?: number;
  issuanceOfDebt?: number;
  purchaseOfBusiness?: number;
  longTermDebtIssuance?: number;
  interestIncome?: number;
  netInterestIncome?: number;
  deferredIncomeTax?: number;
  interestExpense?: number;
  netNonOperatingInterestIncomeExpense?: number;
  interestExpenseNonOperating?: number;
  netBusinessPurchaseAndSale?: number;
}
export interface FundamentalsTimeSeriesCashFlowResult {
  date: Date;
  TYPE: "CASH_FLOW";
  periodType: FundamentalsTimeSeries_Period;
  freeCashFlow?: number;
  foreignSales?: number;
  domesticSales?: number;
  adjustedGeographySegmentData?: number;
  repurchaseOfCapitalStock?: number;
  repaymentOfDebt?: number;
  issuanceOfDebt?: number;
  issuanceOfCapitalStock?: number;
  capitalExpenditure?: number;
  interestPaidSupplementalData?: number;
  incomeTaxPaidSupplementalData?: number;
  endCashPosition?: number;
  otherCashAdjustmentOutsideChangeinCash?: number;
  beginningCashPosition?: number;
  effectOfExchangeRateChanges?: number;
  changesInCash?: number;
  otherCashAdjustmentInsideChangeinCash?: number;
  cashFlowFromDiscontinuedOperation?: number;
  financingCashFlow?: number;
  cashFromDiscontinuedFinancingActivities?: number;
  cashFlowFromContinuingFinancingActivities?: number;
  netOtherFinancingCharges?: number;
  interestPaidCFF?: number;
  proceedsFromStockOptionExercised?: number;
  cashDividendsPaid?: number;
  preferredStockDividendPaid?: number;
  commonStockDividendPaid?: number;
  netPreferredStockIssuance?: number;
  preferredStockPayments?: number;
  preferredStockIssuance?: number;
  netCommonStockIssuance?: number;
  commonStockPayments?: number;
  commonStockIssuance?: number;
  netIssuancePaymentsOfDebt?: number;
  netShortTermDebtIssuance?: number;
  shortTermDebtPayments?: number;
  shortTermDebtIssuance?: number;
  netLongTermDebtIssuance?: number;
  longTermDebtPayments?: number;
  longTermDebtIssuance?: number;
  investingCashFlow?: number;
  cashFromDiscontinuedInvestingActivities?: number;
  cashFlowFromContinuingInvestingActivities?: number;
  netOtherInvestingChanges?: number;
  interestReceivedCFI?: number;
  dividendsReceivedCFI?: number;
  netInvestmentPurchaseAndSale?: number;
  saleOfInvestment?: number;
  purchaseOfInvestment?: number;
  netInvestmentPropertiesPurchaseAndSale?: number;
  saleOfInvestmentProperties?: number;
  purchaseOfInvestmentProperties?: number;
  netBusinessPurchaseAndSale?: number;
  saleOfBusiness?: number;
  purchaseOfBusiness?: number;
  netIntangiblesPurchaseAndSale?: number;
  saleOfIntangibles?: number;
  purchaseOfIntangibles?: number;
  netPPEPurchaseAndSale?: number;
  saleOfPPE?: number;
  purchaseOfPPE?: number;
  capitalExpenditureReported?: number;
  operatingCashFlow?: number;
  cashFromDiscontinuedOperatingActivities?: number;
  cashFlowFromContinuingOperatingActivities?: number;
  taxesRefundPaid?: number;
  interestReceivedCFO?: number;
  interestPaidCFO?: number;
  dividendReceivedCFO?: number;
  dividendPaidCFO?: number;
  changeInWorkingCapital?: number;
  changeInOtherWorkingCapital?: number;
  changeInOtherCurrentLiabilities?: number;
  changeInOtherCurrentAssets?: number;
  changeInPayablesAndAccruedExpense?: number;
  changeInAccruedExpense?: number;
  changeInInterestPayable?: number;
  changeInPayable?: number;
  changeInDividendPayable?: number;
  changeInAccountPayable?: number;
  changeInTaxPayable?: number;
  changeInIncomeTaxPayable?: number;
  changeInPrepaidAssets?: number;
  changeInInventory?: number;
  changeInReceivables?: number;
  changesInAccountReceivables?: number;
  otherNonCashItems?: number;
  excessTaxBenefitFromStockBasedCompensation?: number;
  stockBasedCompensation?: number;
  unrealizedGainLossOnInvestmentSecurities?: number;
  provisionandWriteOffofAssets?: number;
  assetImpairmentCharge?: number;
  amortizationOfSecurities?: number;
  deferredTax?: number;
  deferredIncomeTax?: number;
  depletion?: number;
  depreciationAndAmortization?: number;
  amortizationCashFlow?: number;
  amortizationOfIntangibles?: number;
  depreciation?: number;
  operatingGainsLosses?: number;
  pensionAndEmployeeBenefitExpense?: number;
  earningsLossesFromEquityInvestments?: number;
  gainLossOnInvestmentSecurities?: number;
  netForeignCurrencyExchangeGainLoss?: number;
  gainLossOnSaleOfPPE?: number;
  gainLossOnSaleOfBusiness?: number;
  netIncomeFromContinuingOperations?: number;
  cashFlowsfromusedinOperatingActivitiesDirect?: number;
  taxesRefundPaidDirect?: number;
  interestReceivedDirect?: number;
  interestPaidDirect?: number;
  dividendsReceivedDirect?: number;
  dividendsPaidDirect?: number;
  classesofCashPayments?: number;
  otherCashPaymentsfromOperatingActivities?: number;
  paymentsonBehalfofEmployees?: number;
  paymentstoSuppliersforGoodsandServices?: number;
  classesofCashReceiptsfromOperatingActivities?: number;
  otherCashReceiptsfromOperatingActivities?: number;
  receiptsfromGovernmentGrants?: number;
  receiptsfromCustomers?: number;
  increaseDecreaseInDeposit?: number;
  changeInFederalFundsAndSecuritiesSoldForRepurchase?: number;
  netProceedsPaymentForLoan?: number;
  paymentForLoans?: number;
  proceedsFromLoans?: number;
  proceedsPaymentInInterestBearingDepositsInBank?: number;
  increaseinInterestBearingDepositsinBank?: number;
  decreaseinInterestBearingDepositsinBank?: number;
  proceedsPaymentFederalFundsSoldAndSecuritiesPurchasedUnderAgreementToResell?: number;
  changeInLoans?: number;
  changeInDeferredCharges?: number;
  provisionForLoanLeaseAndOtherLosses?: number;
  amortizationOfFinancingCostsAndDiscounts?: number;
  depreciationAmortizationDepletion?: number;
  realizedGainLossOnSaleOfLoansAndLease?: number;
  allTaxesPaid?: number;
  interestandCommissionPaid?: number;
  cashPaymentsforLoans?: number;
  cashPaymentsforDepositsbyBanksandCustomers?: number;
  cashReceiptsfromFeesandCommissions?: number;
  cashReceiptsfromSecuritiesRelatedActivities?: number;
  cashReceiptsfromLoans?: number;
  cashReceiptsfromDepositsbyBanksandCustomers?: number;
  cashReceiptsfromTaxRefunds?: number;
  AmortizationAmortizationCashFlow?: number;
}
export type FundamentalsTimeSeriesAllResult = Omit<
  FundamentalsTimeSeriesFinancialsResult,
  "TYPE"
> &
  Omit<FundamentalsTimeSeriesBalanceSheetResult, "TYPE"> &
  Omit<FundamentalsTimeSeriesCashFlowResult, "TYPE"> & {
    TYPE: "ALL";
  };
export type FundamentalsTimeSeriesResult =
  | FundamentalsTimeSeriesBalanceSheetResult
  | FundamentalsTimeSeriesCashFlowResult
  | FundamentalsTimeSeriesFinancialsResult
  | FundamentalsTimeSeriesAllResult;
export type FundamentalsTimeSeriesResults = Array<FundamentalsTimeSeriesResult>;
export interface FundamentalsTimeSeriesOptions {
  period1: Date | number | string;
  period2?: Date | number | string;
  type?: string;
  merge?: boolean;
  padTimeSeries?: boolean;
  lang?: string;
  region?: string;
  module: string;
}
/**
 * Get detailed financial statements (income statement, balance sheet, cash flow statement)
 * over time (quarterly or annually).
 *
 * **See the {@link [modules/fundamentalsTimeSeries] fundamentalsTimeSeries module}  {@link [modules/fundamentalsTimeSeries] fundamentalsTimeSeries module} docs for examples and more.
 */
