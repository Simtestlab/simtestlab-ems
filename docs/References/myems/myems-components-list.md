# MyEMS Components Documentation

This document describes key components in the **MyEMS** React application.  

---

## Advanced Reporting

### AdvancedReporting.js  
A page component that lets users generate and view advanced energy reports.  
- **State & Effects**  
  - Manages authentication cookies via `getCookieValue`/`createCookie`.  
  - Tracks date range, period type, loading and export states.  
  - Uses `useEffect` to enforce login and refresh tokens.  
- **UI Structure**  
  - `<FalconCardHeader>` with date range picker (`DateRangePickerWrapper`).  
  - Submit button triggers API fetch to `APIBaseURL + '/reports/advancedreporting?...'`.  
  - Displays either an `<Alert>` (no data) or grid of **Summary** items.  
- **Relationships**  
  - Imports `Summary.js` to render each report entry.  
  - Uses helper utils (`createMarkup`, `checkEmpty`, `handleAPIError`).  
  - Wrapped by HOC `withRedirect` and `withTranslation` for routing and i18n.  

```js
import Summary from './Summary';
import FalconCardHeader from './common/FalconCardHeader';
import DateRangePickerWrapper from './common/DateRangePickerWrapper';
```

---

### Summary.js  
A presentational component showing a single report item with export functionality.  
- **Props**  
  - `calendar`: `{ month, day }` object for date icon.  
  - `title`, `to`: link text and route.  
  - `badge`: optional badge config.  
  - `file_bytes_base64`: Base64 file to download.  
- **Features**  
  - Renders a `<Calendar>` icon and `<Media>` layout.  
  - Clicking title link triggers `handleExport` to download the file.  
  - Optional divider (`<hr>`) between items.  

```js
<Media>
  <Calendar {...calendar} />
  <Media body>
    <h6>
      <Link to={to} onClick={handleExport(title, file_bytes_base64)}>
        {title}
      </Link>
      {badge && <ReportBadge {...badge} />}
    </h6>
    {children}
    {divider && <hr />}
  </Media>
</Media>
```

---

## Auxiliary System

### DistributionSystem.js  
Allows selection of a distribution system and displays its real-time data and layout.  
- **Flow**  
  1. Fetch list of systems on mount.  
  2. User selects system from `<CustomInput type="select">`.  
  3. Shows `<RealtimeChart>` for live point values.  
  4. Renders `<img>` or SVG floor plan via injected HTML.  
- **Auth & Cookies**  
  - Validates login cookies and refreshes them.  
- **Relationships**  
  - Uses `RealtimeChart.js` for live data feed.  
  - Leverages `ScorpioMenu` for context menu and `Dialog` for detailed views.  

```js
import RealtimeChart from './RealtimeChart';
import ScorpioMenu from 'scorpio-menu';
```

---

### EnergyFlowDiagram.js  
Renders Sankey diagrams of energy flows within spaces.  
- **Core**  
  - Uses **ECharts** Sankey chart via `ReactEchartsCore`.  
  - User selects space tree (`rc-cascader`) and date range.  
  - Fetches from `/reports/spaceenergydiagram?...`.  
- **UI Elements**  
  - `<Breadcrumb>` for navigation.  
  - `<ButtonIcon>` for export to Excel.  
  - Detailed data table (`DetailedDataTable`).  
- **Relationships**  
  - Imports `DateRangePickerWrapper`, `ButtonIcon`, helper utils, and HOCs.  

```js
import ReactEchartsCore from 'echarts-for-react/lib/core';
import { SankeyChart } from 'echarts/charts';
import DateRangePickerWrapper from './common/DateRangePickerWrapper';
import ButtonIcon from './common/ButtonIcon';
```

---

### RealtimeChart.js  
A class component polling live measurements for a meter or circuit.  
- **Lifecycle**  
  - On mount: fetch initial data from `/reports/meterrealtime?...` or `/reports/distributionsystem?...`.  
  - Sets up `setInterval` to refresh at configured intervals.  
  - Cleans timers on unmount.  
- **State**  
  - `pointList`: array of `{ circuit, point, value, units }`.  
  - `trendLog`, `chartData` for timeline chart (in meter variant).  
- **UI**  
  - `<Card>` with `<ListGroup>` items listing live values.  
  - Optionally renders small line charts for recent trend.  

```js
class RealtimeChart extends Component {
  componentDidMount() {
    fetch(APIBaseURL + '/reports/meterrealtime?meterid=' + this.props.meterId)
      .then(res => res.json())
      .then(json => this.setState({ pointList: /* parsed */ }));
    // start interval...
  }
  render() {
    return (
      <Card>
        <ListGroup>
          {this.state.pointList.map(item => (
            <ListGroupItem>{item.point}: {item.value}{item.units}</ListGroupItem>
          ))}
        </ListGroup>
      </Card>
    );
  }
}
```

---

## Combined Equipment

A suite of **12** route-based report pages under `/combinedequipment/*`. Each feature module follows a common pattern:

1. **Selection Form**  
   - Cascader or select inputs for space and equipment.  
   - Period type and date range pickers (`DateRangePickerWrapper`).  
2. **Summary Cards**  
   - Renders cumulative figures using `<CardSummary>` or `<CountUp>`.  
3. **Charts**  
   - `<MultiTrendChart>` for comparing base versus reporting period.  
   - `<MultipleLineChart>` for operating characteristic curves.  
4. **Data Tables**  
   - `<DetailedDataTable>` for row-level metrics.  
   - `<AssociatedEquipmentTable>` on “statistics” pages.  
5. **Export**  
   - `<ButtonIcon>` to download Excel, using `excel_bytes_base64`.  

### List of Components

| File                                   | Purpose                                |
|----------------------------------------|----------------------------------------|
| CombinedEquipmentEnergyCategory.js     | Energy use broken down by category     |
| CombinedEquipmentEnergyItem.js         | Consumption by energy item             |
| CombinedEquipmentCarbon.js             | Combined equipment carbon emissions    |
| CombinedEquipmentCost.js               | Cost metrics per energy category       |
| CombinedEquipmentOutput.js             | Production or output-related indices   |
| CombinedEquipmentIncome.js             | Calculated income from outputs         |
| CombinedEquipmentEfficiency.js         | Efficiency KPIs and related charts     |
| CombinedEquipmentLoad.js               | Load curves and peak analysis          |
| CombinedEquipmentSaving.js             | Energy and cost saving information     |
| CombinedEquipmentPlan.js               | Plan versus actual comparisons         |
| CombinedEquipmentStatistics.js         | Comprehensive statistics and relations |
| CombinedEquipmentComparison.js         | Compare two combined equipment units   |
| CombinedEquipmentBatch.js              | Batch analyses across time windows     |

All import shared utilities:

```js
import { getCookieValue, createCookie, checkEmpty, handleAPIError } from '../helpers/utils';
import FalconCardHeader from '../common/FalconCardHeader';
import MultiTrendChart from '../common/MultiTrendChart';
import DetailedDataTable from '../common/DetailedDataTable';
```

---

## Settings

A multi-section settings page composed via **ContentWithAsideLayout**.  

- **SettingsAccount.js**  
  - Manages privacy controls such as who can view profile and tag the user.  
  - Uses `CustomInput` radios and switches to toggle each visibility option.  
  - Shows `UncontrolledTooltip` explanations for each setting group.  

- **SettingsBilling.js**  
  - Displays current plan and payment state as read-only information.  
  - Provides “Update Plan” button that links to upgrade flow.  
  - Keeps layout simple with a `FalconCardHeader` and two card bodies.  

- **SettingsChangePassword.js**  
  - Renders change password form with old and new password fields.  
  - Uses `FormGroupInput` and local state for validation and disable logic.  

- **SettingsDangerZone.js**  
  - Shows dangerous actions like account deletion or data reset.  
  - Usually contains confirmation prompts and red buttons.  

- **SettingsProfile.js**  
  - Full profile editing form for first name, last name and contacts.  
  - Also allows editing headline and long introduction biography.  

```js
<ContentWithAsideLayout
  banner={<SettingsBanner />}
  aside={<><SettingsAccount /><SettingsBilling /><SettingsChangePassword /><SettingsDangerZone/></>}
>
  <SettingsProfile />
  {/* additional experience/education widgets */}
</ContentWithAsideLayout>
```

---

## Association Component

### Association.js  
Displays a simple media card for an organization or group.  
- **Props**  
  - `imgSrc`: association logo image source.  
  - `title`: association or company name.  
  - `description`: short description of the association.  
  - `to`: route to navigate for full details.  
- **Rendering**  
  - Uses `<Media>` to align logo and text horizontally.  
  - Wraps title in a `stretched-link` to make full item clickable.  

```jsx
<Media className="align-items-center mb-2">
  <img className="mr-2" src={imgSrc} width={50} alt="" />
  <Media body>
    <h6 className="fs-0 mb-0">
      <Link className="stretched-link" to={to}>
        {title}
      </Link>
    </h6>
    <p className="mb-0">{description}</p>
  </Media>
</Media>
```

Used in user profiles and the `/pages/associations` listing.  

---

## Authentication Components

Re-usable form pieces and pages under `/authentication/basic/*`.  

| File                         | Purpose                                   |
|------------------------------|-------------------------------------------|
| ConfirmMailContent.js        | Generic confirm-email content             |
| ForgetPasswordForm.js        | Request password reset link               |
| LockScreenForm.js            | Prompt for password on lock screen        |
| LoginForm.js                 | Login with email, password and captcha   |
| LogoutContent.js             | Logout success message                    |
| PasswordResetForm.js         | Set a new password after reset            |
| RegistrationForm.js          | Register new account with validation      |
| SocialAuthButtons.js         | Render social OAuth buttons               |

- **ConfirmMailContent.js**  
  - Shows envelope illustration, message and “Return to login” button.  
  - Accepts `email`, `layout`, and `titleTag` to vary context.  

- **ForgetPasswordForm.js**  
  - Contains single email input and submit button.  
  - Uses `withRedirect` to navigate to confirm mail screen after submit.  
  - Shows a toast summarizing the email that received the link.  

- **LockScreenForm.js**  
  - Password-only form for when session remains but UI is locked.  
  - Often used inside card or centered container with avatar.  

- **LoginForm.js**  
  - Handles email, password, “remember me”, and captcha code.  
  - Uses cookies and local storage helpers to persist email.  
  - Sends POST to backend login endpoint and handles errors.  

- **LogoutContent.js**  
  - Displays goodbye text and “Return to Login” link.  
  - Used by both basic and card logout pages.  

- **PasswordResetForm.js**  
  - Accepts new and confirm password fields with simple match validation.  
  - Redirects to login page after success toast.  

- **RegistrationForm.js**  
  - Collects name, email, password and confirmation.  
  - Includes terms checkbox and disables submit until valid.  
  - Calls `SocialAuthButtons` under a divider for alternative sign-in.  

- **SocialAuthButtons.js**  
  - Renders two small buttons for Google and Facebook.  
  - Uses `FontAwesomeIcon` for brand icons.  

**Page Wrappers**  
- **AuthBasicRoutes.js**  
  - Maps `/authentication/basic/*` paths to MyEMS-specific auth pages.  
- **AuthCardRoutes.js**  
  - Uses card-style auth layout for `/authentication/card/*`.  
- **basic/*.js** and **card/*.js**  
  - Small wrappers that assemble header text and embed forms.  

```js
<Switch>
  <Route path="/authentication/basic/login" component={Login} />
  <Route path="/authentication/basic/register" component={Registration} />
  {/* ... */}
  <Redirect to="/errors/404" />
</Switch>
```

---

## Other Components Under `src/components`

This section documents all remaining folders and files under the `src/components` tree, beyond the `MyEMS` namespace.  

---

### Bootstrap Components (`src/components/bootstrap-components`)  

These components wrap and demonstrate Reactstrap UI elements. Each file is a doc-style page with a header, examples, and highlighted code.  

- **Alerts.js**  
  - Shows basic, dismissible, and contextual alerts.  
  - Uses `<Alert>` with different colors and includes code samples.  

- **AutocompleteExample.js**  
  - Demonstrates an autocomplete text field using a plugin or custom logic.  
  - Includes example data, filtering behavior, and selection callbacks.  

- **Avatar.js**  
  - Documents avatar component usage, including size, shape, and status.  
  - Shows avatars in lists and within media objects.  

- **Backgrounds.js**  
  - Shows usage of background utility classes like `bg-light`, gradients.  
  - Displays example cards with different background combinations.  

- **Badges.js**  
  - Demonstrates inline badges, pill badges and badge in buttons.  
  - Explains semantic meanings of each color.  

- **Breadcrumb.js**  
  - Shows how to build breadcrumb navigation using `<BreadcrumbItem>`.  
  - Includes examples with icons and links.  

- **Buttons.js**  
  - Demonstrates primary, outline, link and size variations.  
  - Shows button groups, block buttons, and icon buttons.  

- **Cards.js**  
  - Documents card layouts with headers, footers, images and lists.  
  - Displays grid of cards to show responsive behavior.  

- **Carousel.js**  
  - Contains a full example of `<Carousel>` with slides, indicators, and controls.  
  - Shows how to manage `activeIndex` and animation state.  

- **Collapses.js**  
  - Demonstrates simple collapse toggles and accordion groups.  
  - Uses `Collapse` and `Card` to show hideable panels.  

- **Combo.js**  
  - Likely combines several components, such as input groups with buttons.  
  - Serves as a playground for composite UI patterns.  

- **CookieAlert.js / CookieNotice.js**  
  - Provide top or bottom sticky cookie banners.  
  - Show close button that hides banner and may set a cookie.  

- **Dropdowns.js**  
  - Demonstrates single and split dropdown buttons.  
  - Shows right-aligned menus and nested items.  

- **FalconAccordions.js**  
  - Custom accordion style using cards and icons.  
  - Allows only one item open at a time for clarity.  

- **Forms.js**  
  - Collects form examples with grid layouts, form rows, and validation states.  
  - Demonstrates custom checkboxes and radios as well.  

- **ListGroups.js**  
  - Shows basic list groups, active items, flush style, and links.  

- **Modals.js**  
  - Demonstrates modal sizes, vertically centered modals and scrollable content.  

- **NavBarTop.js / Navbars.js / Navs.js**  
  - `NavBarTop.js` documents a sticky top header with menus.  
  - `Navbars.js` shows many navbar variations.  
  - `Navs.js` focuses only on tabbed and pill navigation elements.  

- **PageHeaders.js**  
  - Demonstrates headers with title, subtitle and action buttons.  

- **Paginations.js**  
  - Shows pagination controls with previous, next and numeric items.  

- **Popovers.js / Tooltips.js**  
  - `Popovers.js` shows click and hover triggers with different placements.  
  - `Tooltips.js` covers simple tooltips on icons or text.  

- **ProgressBar.js**  
  - Documents plain, striped and animated progress bars.  

- **Sidepanel.js**  
  - Example of slide-in side panel triggered from button clicks.  

- **Spinners.js**  
  - Demonstrates border and grow spinners in various colors and sizes.  

- **Tables.js**  
  - Shows simple, striped, bordered and responsive tables.  

- **Tabs.js**  
  - Demonstrates tabs driven by stateful `activeTab` variable.  

- **VerticalNavbar.js**  
  - Documents vertical navigation layout with nested nav items.  

---

### Calendar (`src/components/calendar`)  

Calendar-related UI for scheduling events. Each file contributes to a calendar view with event editing.  

- **Calendar.js**  
  - Main calendar component using a calendar library.  
  - Handles viewing month, week, or day views and event click actions.  

- **AddScheduleModal.js**  
  - Modal with form fields for event title, time range and attendees.  
  - Submits new event to parent component via callback props.  

- **CalendarEventModal.js**  
  - Shows details of selected event including description and location.  
  - Provides buttons to edit or delete the event.  

---

### Changelog (`src/components/changelog`)  

Displays project change history and update notes.  

- **ChangeLog.js**  
  - Top-level page that imports `changeLogs.js`.  
  - Maps versions to `Logs` components and structures them by category.  

- **Logs.js**  
  - Presentational component that renders one version’s “New”, “Fix” and “Migration” lists.  
  - Accepts props for title, publish date and structured log data.  

- **changeLogs.js**  
  - Static JavaScript array listing each release.  
  - Groups text entries under categories like `New`, `Fix` and `Migration`.  

---

### Chart Wrapper (`src/components/chart/Chart.js`)  

Provides a unified wrapper around a charting library.  
- Accepts props such as `type`, `data`, `options`, `height` and `width`.  
- Abstracts away direct Chart.js or ECharts calls to keep usage consistent.  

```js
<Chart type="line" data={data} options={options} height={200} />
```

---

### Chat (`src/components/chat`)  

Implements a simple chat experience using context.  

- **ChatProvider.js**  
  - Holds messages, selected conversation and dispatch methods in context.  
  - Uses `useReducer` to handle sending, deleting or editing messages.  

- **Chat.js**  
  - Renders sidebar with list of chats and main panel with messages.  
  - Contains message input box and uses provider’s dispatch to send.  

---

### Common Components (`src/components/common`)  

These are low-level reusable UI primitives used across the app.  

- **Avatar.js**  
  - Generic avatar with `size`, `rounded`, and `status` props.  
  - Handles both image sources and initials fallback.  

- **Background.js**  
  - Wraps content with background color or image classes.  
  - Accepts overlay options to darken or lighten backgrounds.  

- **ButtonIcon.js / ButtonIconTooltip.js**  
  - `ButtonIcon` wraps Reactstrap button and FontAwesome icon.  
  - `ButtonIconTooltip` attaches a tooltip to the button automatically.  

- **Calendar.js**  
  - Small calendar tile used in feeds and summaries.  
  - Renders month and day values and handles click events.  

- **CodeHighlight.js**  
  - Wraps syntax highlighter to display code blocks.  
  - Accepts language, code string and copy-to-clipboard option.  

- **Debug.js**  
  - Dumps JSON representation of props or state for debugging.  

- **Divider.js**  
  - Horizontal divider with optional caption inside.  

- **Dot.js**  
  - Tiny circle used for legends or status indicators.  
  - Accepts color and size props.  

- **FalconCardFooterLink.js**  
  - Card footer with right-aligned link and tiny chevron icon.  

- **FalconCardHeader.js**  
  - Standard header with title, subtitle and extra content slot.  

- **FalconDropzone.js**  
  - Configured dropzone for drag and drop uploads.  
  - Provides preview thumbnails and onChange callbacks.  

- **FalconEditor.js**  
  - Embedded code editor used to show live examples.  
  - Accepts code string and scope of variables.  

- **FalconInput.js**  
  - Reusable input wrapper that merges label, help text and errors.  

- **FalconLightBox.js / LightBoxGallery.js**  
  - Provide simple or gallery-based lightbox interactions in modals.  

- **FalconPlyr.js**  
  - Wraps Plyr player to play audio or video with custom theme.  

- **FalconProgress.js / FalconProgressBar.js**  
  - Progress components with extra labels and multi-bar support.  

- **Flex.js**  
  - Simplifies flexbox alignment by using `justify` and `align` props.  

- **FormGroupInput.js / FormGroupSelect.js**  
  - Combine labels, form controls, and feedback in one component.  

- **HighlightMedia.js**  
  - Media object with icon or thumbnail and text.  
  - Used in profile highlights and quick stats.  

- **Loader.js**  
  - Generic loading component with optional text and animation.  

- **PageHeader.js**  
  - Page-level header with title, description and action slot.  

- **QuantityController.js**  
  - Counter with plus and minus buttons and numeric input.  

- **QuillEditor.js**  
  - Integration of Quill editor as a controlled component.  

- **ScrollBarCustom.js**  
  - Wraps content in a `react-scrollbars-custom` instance.  

- **Section.js**  
  - Top-level layout wrapper for sections with padding and background.  

- **Select.js**  
  - Styled wrapper around `react-select` with theme colors.  

- **Toast.js**  
  - Toast container and helper for global toast messages.  

- **Verified.js**  
  - Badge with checkmark displayed next to verified usernames.  

---

### Dashboard (`src/components/dashboard`)  

Main analytics dashboard for the application.  

- **Dashboard.js**  
  - Orchestrates layout of all dashboard tiles and charts.  
  - Pulls data from static constants or remote hooks.  

- **CardSummary.js**  
  - KPI card that shows title, value, percentage change and icon.  
  - Accepts color, `rate`, and `footunit` props.  

- **ActiveUsersBarChart.js**  
  - Bar chart displaying active users per time unit.  

- **ActiveUsersMap.js**  
  - Visualizes user locations on a map, often using Leaflet or Mapbox.  

- **DashboardDepositStatus.js**  
  - Displays deposit-related stats, including current and historical values.  

- **LeafletMap.js / MarkerCluster.js**  
  - `LeafletMap.js` encapsulates base Leaflet map creation.  
  - `MarkerCluster.js` adds cluster grouping for many markers.  

- **PaymentsLineChart.js**  
  - Line chart of payments over time with tooltips and legends.  

- **PurchasesTable.js / PurchasesTableActions.js**  
  - `PurchasesTable.js` presents table of purchase records.  
  - `PurchasesTableActions.js` includes inline actions like view, edit or delete.  

- **constants.js**  
  - Contains static data arrays used across these dashboard widgets.  

---

### Alternative Dashboard (`src/components/dashboard-alt`)  

A different look and feel for dashboard views with modular widgets.  

- **DashboardAlt.js**  
  - Composes many small stats cards into a modern dashboard.  

- **ActiveUser.js / ActiveUsers.js**  
  - Individual active user card and list summarizing current activity.  

- **BandwidthSaved.js**  
  - Widget showing amount of bandwidth saved, maybe in GB.  

- **BestSellingProduct.js / BestSellingProducts.js**  
  - Single product widget and list of top sellers by sales metrics.  

- **CardDropdown.js**  
  - Reusable dropdown embedded inside card headers.  

- **EcharGraph.js**  
  - General ECharts-based graph wrapper for alternative dashboard.  

- **MarketShare.js / MarketShareItem.js**  
  - Doughnut or pie chart with breakdown items and percentages.  

- **RunningProject.js / RunningProjects.js**  
  - Show project cards for work in progress and their statuses.  

- **SharedFile.js / SharedFiles.js**  
  - Single shared file card and list of shared files.  

- **SpaceWarning.js**  
  - Warns when disk or storage space is near limits.  

- **StorageStatus.js / StorageStatusDot.js / StorageStatusProgressBar.js**  
  - Provide summary of used versus free storage with dots and bars.  

- **TopProducts.js**  
  - Grid or list of products by ranking.  

- **TotalOrder.js / TotalSales.js**  
  - KPIs for total orders and total revenue.  

- **Weather.js**  
  - Small weather widget showing temperature and conditions.  

- **WeeklySales.js**  
  - Chart of sales aggregated by weekday.  

---

### Documentation (`src/components/documentation/GettingStarted.js`)  

Provides a “Getting Started” guide.  
- Explains folder structure, theme configuration, and basic dependencies.  
- Uses `<PageHeader>` and `<CodeHighlight>` for layout and examples.  
- Links to official documentation and external resources.  

---

### E-commerce (`src/components/e-commerce`)  

Implements product listing, details, cart and checkout flows.  

- **ProductProvider.js**  
  - Wraps children in `ProductContext` provider.  
  - Stores `products`, `shoppingCart`, `wishlist` and `appliedPromo`.  
  - Uses `arrayReducer` to add, remove, edit or sort products in lists.  

- **Products.js**  
  - Shows product catalog using `ProductContext` data.  
  - Supports pagination, filters and search input.  

- **ProductDetails.js**  
  - Reads `id` from route params and finds product in context.  
  - Redirects to first product if `id` does not exist.  
  - Embeds `ProductDetailsMedia`, `ProductDetailsMain`, and `ProductDetailsFooter`.  

- **ProductAdd.js**  
  - Form to create a new product with fields like name and price.  
  - Uses `FalconDropzone` for image upload and displays preview.  

- **Customers.js**  
  - Lists customer entries with basic info and actions.  

- **Orders.js / OrderDetails.js / OrderDetailsHeader.js**  
  - `Orders.js` shows order table with statuses and totals.  
  - `OrderDetails.js` renders full order breakdown including items.  
  - `OrderDetailsHeader.js` displays order metadata such as id and date.  

- **ShoppingCart.js**  
  - Shows cart items with `QuantityController` and computed totals.  
  - Integrates cart modal via `CartModal` and calculates discounts.  

- **Checkout.js**  
  - Wraps address, shipping and payment forms with an aside summary.  

- **FavouriteItems.js**  
  - Displays list of favorited products stored in context.  

---

### Education (`src/components/education`)  

Profile education management components.  

- **Education.js**  
  - Orchestrates list of education entries with add and edit controls.  

- **EducationForm.js**  
  - Form for creating or editing one education record.  
  - Includes institution, degree, start and end dates.  

- **EducationInput.js**  
  - Input row used inside `EducationForm` for repeated items.  

- **EducationSummary.js**  
  - Shows timeline or list of education entries in a read-only format.  

---

### Email (`src/components/email`)  

Simple webmail experience.  

- **Inbox.js**  
  - Displays email list using data from `data/email/emails`.  
  - Supports filtering and selection via `useBulkSelect`.  

- **EmailDetail.js**  
  - Shows currently selected message’s body and attachments.  

- **EmailDetailHeader.js**  
  - Renders subject, sender, timestamp and quick actions.  

- **Compose.js**  
  - Full compose view with `ComposeAttachment` area.  
  - Sends composed data to a fake API or logs it.  

- **ComposeAttachment.js**  
  - Uses `FalconDropzone` to attach files to a message.  

---

### Errors (`src/components/errors`)  

Error pages for routing and server failure.  

- **Error404.js**  
  - “Page not found” card with explanation and home button.  
  - Uses `withTranslation` to localize messages.  

- **Error500.js**  
  - Server error screen with suggestions to retry.  
  - Encourages contact with support if issues persist.  

---

### Event (`src/components/event`)  

Event creation and summary components.  

- **EventCreateAside.js**  
  - Side panel explaining steps and requirements for events.  

- **EventCreateBanner.js**  
  - Banner at top of creation page, maybe showing progress.  

- **EventCreateFooter.js**  
  - Fixed footer with Back and Save buttons.  

- **EventCreateSelect.js**  
  - Select inputs for event type, organizer and sponsor.  

- **EventCustomField.js**  
  - Custom fields builder, allowing user to add new inputs.  

- **EventDetailsForm.js**  
  - Form for event title, description, and organizer info.  

- **EventScheduleForm.js**  
  - Inputs for start and end date, timezone and recurrence.  

- **EventSummary.js**  
  - Card summarizing event for listings and feed interest pages.  

- **EventTicket.js**  
  - Ticket layout with ticket name, price and sale status.  

---

### Experience (`src/components/experience`)  

Work experience management.  

- **Experience.js**  
  - Container listing experiences and toggling edit mode.  

- **ExperienceForm.js**  
  - Form for creating new experience entries.  
  - Includes company, title, description and date range fields.  

- **ExperienceInput.js**  
  - Individual input fields extracted for reuse within forms.  

- **ExperienceSummary.js**  
  - Read-only list of experience entries, often used on profile.  

---

### Extra (`src/components/extra`)  

Miscellaneous additional demos.  

- **Pdf.js**  
  - Demonstrates embedding or generating PDF documents.  

- **Starter.js**  
  - Bare-bones page that contains only minimal scaffolding.  

---

### FAQ (`src/components/faq`)  

Frequently asked questions UI.  

- **FaqCol.js**  
  - Column wrapper used to place multiple FAQ items in grid.  

- **FaqCollapse.js**  
  - Accordion that expands answers when user clicks questions.  

---

### Feed (`src/components/feed`)  

Implements a social style feed with posts and interactions.  

- **Feed.js**  
  - Main container combining sidebar and central posts column.  

- **FeedProvider.js**  
  - Provides `FeedContext` with `feeds` and a dispatch method.  

- **FeedSideBar.js**  
  - Renders `BirthdayNotice`, `AddToFeed`, and `FeedInterest` vertically.  

- **AddToFeed.js**  
  - Simple input box for quick status posts.  

- **PostCreateForm.js**  
  - Larger form for composing post with text, URL or images.  

- **ButtonImgPostCreate.js**  
  - Button which opens file picker to add images to posts.  

- **FeedCard.js / FeedCardHeader.js / FeedCardContent.js / FeedCardFooter.js**  
  - Structural components for a feed item, split into header, body and footer.  

- **Comments.js**  
  - Lists comments under a post with reply and like actions.  

- **LikeComentShareCount.js**  
  - Displays counts of likes, comments and shares for a post.  

- **FeedEvent.js**  
  - Specialized card to display event inside feed.  

- **FeedImageLightbox.js**  
  - Lightbox of images when thumbnails are clicked.  

- **FeedUrl.js**  
  - Previews a shared URL with image, domain and description.  

- **BirthdayNotice.js**  
  - Birthday alert card for a friend, with profile link.  

- **PersonFollow.js**  
  - Suggests people to follow with follow button.  

- **IconStatus.js**  
  - Manages a set of icons representing like, comment or share actions.  

---

### Footer (`src/components/footer/Footer.js`)  

Application footer component.  
- Shows links like terms and privacy policy and brand text.  
- Used on both marketing and app pages for consistency.  

---

### Item Banner (`src/components/item`)  

Banner layout used across profile and settings.  

- **ItemBanner.js**  
  - Parent component creating a header and body slot.  

- **ItemBannerHeader.js**  
  - Displays avatar, cover image and optional edit controls.  

- **ItemBannerBody.js**  
  - Holds children content like stats or actions below header.  

---

### Kanban (`src/components/kanban`)  

Implements a Trello-style Kanban board.  

- **KanbanProvider.js**  
  - Holds Kanban state with lists and cards using context and reducer.  

- **Kanban.js**  
  - Page-level component that renders the full Kanban board.  

- **KanbanContainer.js**  
  - Scrollable container for columns, handling drag and drop region.  

- **KanbanHeader.js**  
  - Board header showing name, members, and filter controls.  

- **KanbanColumn.js**  
  - One column for a list such as “To Do” or “Done”.  

- **KanbanColumnHeader.js**  
  - Header area of a column, including title and menu icon.  

- **TaskCard.js**  
  - Represents a single task card with title, labels and badges.  

- **AddAnotherCard.js / AddAnotherList.js**  
  - Buttons that open inputs to create new cards or columns.  

- **KanbanModal.js**  
  - Modal showing card details with tabs for activity, attachments and labels.  

- **ModalActivityContent.js / ModalAttachmentsContent.js / ModalCommentContetn.js / ModalLabelContent.js / ModalMediaContent.js / modalSideContent.js**  
  - Sub-views of the card modal, each managing a specific aspect.  

- **GroupMember.js / InviteToBoard.js**  
  - Manage board members and invite new collaborators.  

---

### Landing (`src/components/landing`)  

Marketing landing page components.  

- **Landing.js**  
  - Exports a full landing page layout with all sections.  

- **Banner.js**  
  - Hero section with main title, subtitle and primary CTA.  

- **Cta.js**  
  - Strong call-to-action section with button and short text.  

- **SectionHeader.js**  
  - Reusable header used for sections like Features or Process.  

- **CardService.js / Services.js**  
  - `CardService.js` format for a single service card.  
  - `Services.js` arranges multiple service cards in rows.  

- **Processes.js / Process.js**  
  - Visual steps explaining process using icons and text.  

- **Partners.js**  
  - Grid of partner logos with optional links.  

- **FooterStandard.js**  
  - Footer styling specific to landing pages.  

- **Testimonial.js**  
  - Quote block with avatar, name and role.  

---

### Map (`src/components/map/GoogleMap.js`)  

Wrapper for Google Maps.  
- Initializes Google Map instance with given center and zoom.  
- Adds markers or info windows based on props or context data.  

---

### Navbar (`src/components/navbar`)  

Navigation components for top and vertical navigation.  

- **NavbarTop.js / NavbarStandard.js**  
  - Implement top navbars with brand, toggler and right-side widgets.  

- **NavbarVertical.js**  
  - Renders vertical sidebar nav bundle using `NavbarVerticalMenu`.  

- **NavbarVerticalMenu.js / NavbarVerticalMenuItem.js**  
  - Recursive menu structure for sidebar navigation items.  

- **NavbarDropdown.js / NavbarDropdownComponents.js**  
  - Top navbar dropdown for navigation to component examples.  

- **NavbarTopDropDownMenus.js**  
  - Contains configuration objects for user, messages and notifications dropdowns.  

- **Logo.js**  
  - Shows brand logo and redirects to home on click.  

- **CartNotification.js**  
  - Shows mini cart status in navbar for e-commerce demo.  

- **NotificationDropdown.js**  
  - Notification list dropdown including read and unread indicators.  

- **ProfileDropdown.js**  
  - User dropdown with account, settings and logout links.  

- **SearchBox.js**  
  - Search input with icon and suggestion dropdown.  

- **SettingsAnimatedIcon.js**  
  - Icon with animation used to open settings side panel.  

- **ToggleButton.js**  
  - Simple button that toggles vertical navbar visibility.  

- **LandingRightSideNavItem.js / TopNavRightSideNavItem.js**  
  - Render additional right-side nav items linking to docs or help.  

---

### Notification (`src/components/notification/Notification.js`)  

Generic notification row component.  
- Accepts props such as `subject`, `message`, `status`, and `created_datetime`.  
- Styles border and background differently based on status.  
- Used by Activity log, notifications page and dashboard widgets.  

---

### Page Components (`src/components/page`)  

High-level page containers composed from smaller widgets.  

- **Activity.js**  
  - Pulls activity list from fake data and displays notifications.  
  - Uses `useFakeFetch` hook to simulate remote loading.  

- **Associations.js**  
  - Fetches association list and renders `Association` cards in a grid.  

- **Billing.js**  
  - Full billing page with plan selection, payment methods and FAQs.  

- **CustomerDetails.js**  
  - Detailed customer view combining purchases, profile and activity.  

- **Events.js**  
  - Event listing page that lists events for exploration.  

- **EventCreate.js**  
  - Assembles event creation forms, aside and footer actions.  

- **EventDetail.js**  
  - Details for a single event with schedule and tickets.  

- **Faq.js**  
  - Page combining `FaqCol` and `FaqCollapse` into full FAQ.  

- **InvitePeople.js**  
  - Page for sending invitations with email form and link copying.  

- **Invoice.js**  
  - Invoice preview rendered as a styled document, printable.  

- **Member.js**  
  - Member-specific page, using profile-like components.  

- **Notifications.js**  
  - Notification center, listing multiple `Notification` rows.  

- **People.js**  
  - List of people or team members with filters and sort.  

- **Settings.js**  
  - Wraps the settings layout that includes account and profile sections.  

- **Billing.js**  
  - Already described above; handles subscription plan and billing details.  

---

### Plugins (`src/components/plugins`)  

Demonstrate integration of third-party React plugins.  

- **BulkSelect.js**  
  - Example using `useBulkSelect` hook and email data.  
  - Shows how to handle select all and indeterminate checkbox states.  

- **CalendarExample.js**  
  - Demonstrates calendar plugin with event rendering.  

- **Chart.js**  
  - Example page using chart wrapper to show multiple chart types.  

- **CodeHighlightDoc.js**  
  - Documentation page for `CodeHighlight` showing code blocks.  

- **Countup.js**  
  - Shows `react-countup` integration within cards and statistics.  

- **Datetime.js**  
  - Demos date and time pickers with different formats and locales.  

- **Dropzone.js**  
  - Documents drag-and-drop file upload using `react-dropzone`.  

- **EchartMap.js / Echarts.js**  
  - ECharts examples, including geographic maps and standard charts.  

- **EmojiMart.js**  
  - Example page showing emoji selector from EmojiMart.  

- **FontAwesome.js**  
  - Explains Font Awesome integration and icon usage.  

- **GoogleMap.js / Leaflet.js**  
  - Plugin examples for map libraries showing markers and clusters.  

- **ImageLightbox.js**  
  - Demonstrates usage of image lightbox library.  

- **Lottie.js**  
  - Runs Lottie JSON animations with play and pause controls.  

- **Plyr.js**  
  - Shows Plyr video and audio players with custom controls.  

- **ProgressBarJs.js**  
  - Example of progress bar animations using ProgressBar.js.  

- **Quill.js**  
  - Documentation for Quill-based rich text editor integration.  

- **ReactBeautifulDnD.js**  
  - Drag-and-drop examples using `react-beautiful-dnd`.  

- **ReactBootstrapTable2.js**  
  - Demonstrates advanced table features like sorting and pagination.  

- **ReactHookFrom.js**  
  - Examples for form handling using React Hook Form.  

- **Scrollbar.js**  
  - Custom scrollbars examples with theme integration.  

- **Select.js**  
  - Plugin variant of `Select` with additional demos and configuration.  

- **SlickCarousel.js**  
  - Shows Slick carousel with multiple slides and autoplay.  

- **Toastify.js**  
  - Demonstrates toast notifications using `react-toastify`.  

- **Typed.js**  
  - Typed text animation demo using `react-typed` plugin.  

---

### Pricing (`src/components/pricing`)  

Pricing page variants and cards.  

- **Pricing.js / PricingAlt.js**  
  - Complete pages showing tiers like Free, Pro and Enterprise.  
  - Include toggles for monthly versus yearly billing.  

- **PricingCard.js**  
  - Card for a single plan with features list and price.  

- **PricingCardAlt.js**  
  - Alternative styling variant of `PricingCard.js`.  

---

### Profile (`src/components/profile`)  

User profile view and related blocks.  

- **Profile.js**  
  - Full profile page combining banner, aside and content.  

- **ProfileBanner.js**  
  - Wrapper around `ItemBanner` for profile cover and avatar.  

- **ProfileBannerHighlights.js**  
  - Shows follower count and previous jobs in banner.  

- **ProfileBannerIntro.js**  
  - Contains name, verified badge, headline and location text.  

- **ProfileContent.js**  
  - Assembles activity log, associations and gallery in main column.  

- **ProfileFooter.js**  
  - Footer section for profile page with links or actions.  

- **ProfileIntro.js**  
  - Component for short bio, location and web links.  

- **ProfileAside.js**  
  - Side column with contact and other small widgets.  

---

### Side Panel (`src/components/side-panel`)  

Controls for theme settings in a side panel.  

- **SidePanelModal.js**  
  - Modal that contains two main groups: language and nav style.  

- **LanguageRadioBtn.js**  
  - Radio group to select language, calling context update on change.  

- **VerticalNavStyleRadioBtn.js**  
  - Radiobuttons to pick vertical nav style such as default or inverted.  

---

### Utilities (`src/components/utilities`)  

Utility documentation pages that show Bootstrap utility classes.  

- **Borders.js**  
  - Demonstrates `.border`, `.border-top` and color utilities.  

- **Clearfix.js**  
  - Shows how `.clearfix` utility clears floats.  

- **CloseIcon.js**  
  - Documents use of close icons and button markup.  

- **Colors.js**  
  - Displays palette of theme colors with class names.  

- **Display.js**  
  - Demonstrates display utilities like `d-none` and `d-flex`.  

- **Embed.js**  
  - Shows responsive embeds for iframes using `.embed-responsive`.  

- **Figures.js**  
  - Documents figures with captions aligned properly.  

- **Flex.js**  
  - Shows different flex utilities such as `justify-content-center`.  

- **Grid.js**  
  - Explains grid system with examples of rows and columns.  

- **Sizing.js**  
  - Demonstrates width and height utilities like `w-25`.  

- **Spacing.js**  
  - Documents margin and padding classes like `mt-3`, `px-4`.  

- **StretchedLink.js**  
  - Shows how `.stretched-link` makes a full card clickable.  

- **Typography.js**  
  - Demonstrates heading sizes, body text and small text.  

- **VerticalAlign.js**  
  - Shows vertical align classes on table cells and inline elements.  

- **Visibility.js**  
  - Explains visibility utilities like `visible` and `invisible`.  

---

### Widgets (`src/components/widgets`)  

Pre-built widget collections used in dashboards and docs.  

- **Widgets.js**  
  - Main widgets gallery page.  

- **WidgetsSectionTitle.js**  
  - Header for widget sections with icon and description.  

- **ActivityLogWidgets.js**  
  - Multiple activity log variants using `Notification`.  

- **AuthBasicLayoutWidgets.js / AuthSplitLayoutWidgets.js**  
  - Show different authentication layout options.  

- **DropZoneWidget.js**  
  - Widget wrapping `FalconDropzone` in a card.  

- **EcommerceWidgets.js**  
  - Assembles shopping cart, billing and checkout summary widgets.  

- **Errors.js**  
  - Places `Error404` and `Error500` cards side by side.  

- **Forms.js**  
  - Displays registration, login, and password reset widgets.  

- **NumberStatsAndCharts.js**  
  - Mixed KPIs and mini-charts for quick insights.  

- **Others.js**  
  - Miscellaneous widgets not fitting other categories.  

- **RecentPuchasesTable.js**  
  - Table of recent purchase records as a widget.  

- **TablesFilesAndLists.js**  
  - Widgets showing small tables, file lists and to-dos.  

- **UsersAndFeed.js**  
  - Combines user cards and feed previews.  

- **WidgetsBilling.js**  
  - Billing-related widget components such as invoice and plan summary.  

- **WidgetsProducts.js**  
  - Widgets specifically about products and categories.  

---