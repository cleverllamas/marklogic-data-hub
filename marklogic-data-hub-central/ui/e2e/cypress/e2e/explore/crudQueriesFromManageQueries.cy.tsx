import queryComponent from "../../support/components/query/manage-queries-modal";
import entitiesSidebar from "../../support/pages/entitiesSidebar";
import table from "../../support/components/common/tables";
import explorePage from "../../support/pages/explore";
import browsePage from "../../support/pages/browse";
import detailPage from "../../support/pages/detail";
import "cypress-wait-until";


describe("manage queries modal scenarios, developer role", () => {
  before(() => {
    cy.loginAsDeveloper().withRequest();
    cy.deleteSavedQueries();
    explorePage.navigate();
  });

  after(() => {
    cy.loginAsDeveloper().withRequest();
    cy.deleteSavedQueries();
    cy.waitForAsyncRequest();
  });

  it("Create Queries", () => {
    browsePage.switchToTableView();
    browsePage.waitForSpinnerToDisappear();
    browsePage.waitForHCTableToLoad();
    entitiesSidebar.openBaseEntityDropdown();
    entitiesSidebar.selectBaseEntityOption("Customer");
    entitiesSidebar.openBaseEntityFacets("Customer");
    browsePage.getFacetItemCheckbox("name", "Adams Cole").click();
    browsePage.getSelectedFacets().should("exist");
    browsePage.getGreySelectedFacets("Adams Cole").should("exist");
    browsePage.getFacetApplyButton().click();
    table.clickColumnTitle(2);
    browsePage.waitForSpinnerToDisappear();
    entitiesSidebar.backToMainSidebar();
    browsePage.getSaveModalIcon().click();
    browsePage.waitForSpinnerToDisappear();
    cy.waitForAsyncRequest();
    browsePage.getSaveQueryName().should("be.visible").type("newQuery");
    browsePage.getSaveQueryDescription().should("be.visible").type("newQuery description");
    browsePage.getSaveQueryButton().click();
    browsePage.waitForSpinnerToDisappear();
    cy.waitForAsyncRequest();
    cy.log("**Creating another query**");
    browsePage.getEllipsisButton().click();
    browsePage.getSaveACopyModalIcon().click();
    browsePage.getSaveQueryName().clear();
    browsePage.getSaveQueryName().type("newQuery-1");
    browsePage.getSaveQueryButton().click();
  });

  it("Manage queries, edit, apply, delete query", () => {
    explorePage.navigate();
    browsePage.switchToTableView();
    browsePage.waitForSpinnerToDisappear();
    browsePage.waitForHCTableToLoad();
    cy.log("**edit query**");
    explorePage.clickExploreSettingsMenuIcon();
    browsePage.getManageQueriesModalOpened();
    queryComponent.getManageQueryModal().should("be.visible");
    queryComponent.getEditQuery().click();
    queryComponent.getEditQueryName().clear();
    queryComponent.getEditQueryName().type("editedQuery");
    queryComponent.getSubmitButton().click();
    cy.log("**apply query**");
    queryComponent.getQueryByName("editedQuery").click();
    browsePage.waitForSpinnerToDisappear();
    browsePage.getSelectedQuery().should("contain", "editedQuery");
    cy.log("**remove query**");
    explorePage.clickExploreSettingsMenuIcon();
    browsePage.getManageQueriesModalOpened();
    queryComponent.getManageQueryModal().should("be.visible");
    queryComponent.getDeleteQuery();
    browsePage.getManageQueryCloseIcon().click();
    queryComponent.getManageQueryModal().should("not.exist");
    browsePage.getSelectedQuery().should("contain", "select a query");
    browsePage.getSelectedQueryDescription().should("contain", "");
    browsePage.getResetQueryButton().should("exist");

    browsePage.getSaveQueriesDropdown().click();
    browsePage.getQueryOption("editedQuery").should("not.exist");
    browsePage.getSaveQueriesDropdown().click();
    browsePage.waitForSpinnerToDisappear();
    entitiesSidebar.removeSelectedBaseEntity();
    entitiesSidebar.selectBaseEntityOption("Person");
    browsePage.getDetailInstanceViewIcon("/json/persons/last-name-dob-custom1.json").should("be.visible", {timeout: 10000}).click({force: true});
    browsePage.waitForSpinnerToDisappear();
  });

  it("Navigate to detail page and verify if manage query modal opens up.", () => {
    detailPage.getInstanceView().should("exist");
    detailPage.getDocumentTimestamp().should("exist");
    detailPage.getDocumentSource().should("contain", "PersonSourceName");
    detailPage.getDocumentRecordType().should("contain", "json");
    detailPage.getDocumentTable().should("exist");
    detailPage.getMetadataView().should("exist");
    detailPage.getMetadataView().click();
    detailPage.getDocumentUri().should("contain", "/json/persons/last-name-dob-custom1.json");
    explorePage.clickExploreSettingsMenuIcon();
    browsePage.getManageQueriesModalOpened();
    queryComponent.getManageQueryModal().should("be.visible");
    queryComponent.getEditQueryIconForFirstRow().should("be.visible");
    queryComponent.getExportQueryIconForFirstRow().should("be.visible");
    queryComponent.getDeleteQueryIconForFirstRow().should("be.visible");
    browsePage.getManageQueryCloseIcon().click();
    queryComponent.getManageQueryModal().should("not.exist");
    detailPage.getInstanceView().should("exist");
  });

  it("Manage queries, edit, apply, delete query on zero state page", () => {
    explorePage.clickExploreSettingsMenuIcon();
    browsePage.getManageQueriesModalOpened();
    queryComponent.getManageQueryModal().should("be.visible");
    queryComponent.getEditQuery().click();
    queryComponent.getEditQueryName().clear();
    queryComponent.getEditQueryName().type("editedQuery");
    queryComponent.getEditQueryDescription().clear();
    queryComponent.getEditQueryDescription().type("editedQuery-description");
    queryComponent.getSubmitButton().click();
    cy.log("**apply query and verify discard/apply icons are not shown after applying**");
    queryComponent.getQueryByName("editedQuery").click();
    browsePage.waitForSpinnerToDisappear();
    browsePage.getClearGreyFacets().should("not.exist");
    browsePage.getFacetApplyButton().should("not.exist");
    browsePage.getSelectedQuery().should("contain", "editedQuery");
    browsePage.getSelectedQueryDescription().should("contain", "editedQuery-description");
    cy.log("**remove query**");
    browsePage.getResetQueryButton().click();
    explorePage.clickExploreSettingsMenuIcon();
    browsePage.getManageQueriesModalOpened();
    queryComponent.getManageQueryModal().should("be.visible");
    queryComponent.getDeleteQuery();

    queryComponent.getManageQueryModal().should("not.exist");
  });

  it("Verify manage queries modal visibility and removing query scenario on the detail page", () => {
    explorePage.navigate();
    browsePage.switchToTableView();
    browsePage.waitForSpinnerToDisappear();
    browsePage.waitForHCTableToLoad();
    entitiesSidebar.openBaseEntityDropdown();
    entitiesSidebar.selectBaseEntityOption("All Entities");
    entitiesSidebar.openBaseEntityDropdown();
    entitiesSidebar.selectBaseEntityOption("Person");
    entitiesSidebar.openBaseEntityFacets("Person");
    browsePage.getShowMoreLink("fname").should("be.visible").click();
    browsePage.getFacetItemCheckbox("fname", "Alice").click();
    browsePage.getSelectedFacets().should("exist");
    browsePage.getFacetApplyButton().click();
    browsePage.waitForSpinnerToDisappear();
    entitiesSidebar.backToMainSidebar();
    browsePage.getSaveModalIcon().click();
    browsePage.waitForSpinnerToDisappear();
    browsePage.getSaveQueryName().should("be.visible");
    browsePage.getSaveQueryName().type("personQuery-detail");
    browsePage.getSaveQueryButton().click();
    browsePage.waitForSpinnerToDisappear();

    cy.get("#instance").first().click({force: true});
    cy.waitForAsyncRequest();
    browsePage.waitForSpinnerToDisappear();

    explorePage.clickExploreSettingsMenuIcon();
    browsePage.getManageQueriesButton().should("be.visible");
    cy.log("**reload page and verify the manage queries modal button persist**");
    cy.reload();
    cy.waitForAsyncRequest();
    browsePage.waitForSpinnerToDisappear();
    explorePage.clickExploreSettingsMenuIcon();
    browsePage.getManageQueriesButton().should("have.length.gt", 0);
    cy.wait(1000);
    cy.waitForAsyncRequest();
    browsePage.getManageQueriesButton().should("be.visible");
    cy.log("**open manage queries modal dialog and remove previosly saved query**");
    browsePage.getManageQueriesModalOpened();
    queryComponent.getManageQueryModal().should("be.visible");
    queryComponent.getDeleteQuery();
    queryComponent.getManageQueryModal().should("not.exist");
    cy.log("**return back to explore page and verify data display**");
    detailPage.clickBackButton();
    cy.waitForAsyncRequest();
    browsePage.waitForSpinnerToDisappear();
    cy.wait(1000);
    browsePage.getTotalDocuments().should("not.be.equal", 0);
  });

  it("Verify query selection from All Data view page, doesn't stay on card view", () => {
    browsePage.getClearAllFacetsButton().click();
    cy.log("**create a query first**");
    entitiesSidebar.openBaseEntityDropdown();
    entitiesSidebar.selectBaseEntityOption("Person");
    entitiesSidebar.openBaseEntityFacets("Person");
    browsePage.getShowMoreLink("fname").should("be.visible").click();
    browsePage.getFacetItemCheckbox("fname", "Alice").click();
    browsePage.getSelectedFacets().should("exist");
    browsePage.getFacetApplyButton().click();
    browsePage.waitForSpinnerToDisappear();
    entitiesSidebar.backToMainSidebar();
    browsePage.getSaveModalIcon().click();
    browsePage.waitForSpinnerToDisappear();
    browsePage.getSaveQueryName().should("be.visible");
    browsePage.getSaveQueryName().type("personQuery-test");
    browsePage.getSaveQueryButton().click();
    browsePage.waitForSpinnerToDisappear();

    entitiesSidebar.toggleAllDataView();

    cy.log("**Open the manage query modal to apply the recently created query**");
    explorePage.clickExploreSettingsMenuIcon();
    browsePage.getManageQueriesModalOpened();
    queryComponent.getManageQueryModal().should("be.visible");
    queryComponent.getQueryByName("personQuery-test").click();
    cy.waitForAsyncRequest();
    browsePage.waitForSpinnerToDisappear();

    browsePage.validateHCTableRows("Alice");
    table.getTableColumns().should("have.length", 10);
    browsePage.getSelectedFacet("Alice").should("exist");

    cy.intercept("POST", "/api/entitySearch?database=final").as("reqToFinal");
    explorePage.clickExploreSettingsMenuIcon();
    browsePage.getManageQueriesModalOpened();
    cy.wait("@reqToFinal");
    queryComponent.getManageQueryModal().should("be.visible");
    queryComponent.getDeleteQuery();
    cy.waitForAsyncRequest();
    queryComponent.getManageQueryModal().should("not.exist");
    cy.waitForAsyncRequest();
  });

  it("Verify applying previously saved query scenario on the detail page", () => {
    entitiesSidebar.toggleEntitiesView();
    entitiesSidebar.openBaseEntityDropdown();
    entitiesSidebar.selectBaseEntityOption("Person");

    entitiesSidebar.openBaseEntityFacets("Person");
    browsePage.getShowMoreLink("fname").should("be.visible").click();
    browsePage.getFacetItemCheckbox("fname", "Alice").click();
    browsePage.getSelectedFacets().should("exist");
    browsePage.getFacetApplyButton().click();
    browsePage.waitForSpinnerToDisappear();
    entitiesSidebar.backToMainSidebar();
    browsePage.getSaveModalIcon().click();
    browsePage.waitForSpinnerToDisappear();
    browsePage.getSaveQueryName().should("be.visible");
    browsePage.getSaveQueryName().type("personQuery");
    browsePage.getSaveQueryButton().click();
    browsePage.waitForSpinnerToDisappear();
    browsePage.getManageQueryCloseIcon().click();

    cy.log("**open record instance view for a document of a different entity**");
    entitiesSidebar.removeSelectedBaseEntity();
    browsePage.getClearAllFacetsButton().click();
    entitiesSidebar.openBaseEntityDropdown();
    entitiesSidebar.selectBaseEntityOption("Customer");
    cy.get("#instance").first().click({force: true});
    cy.waitForAsyncRequest();
    browsePage.waitForSpinnerToDisappear();

    cy.log("**verify the manage queries modal button is visible**");
    explorePage.clickExploreSettingsMenuIcon();
    browsePage.getManageQueriesButton().should("be.visible");

    cy.log("**open manage queries modal dialog and apply previosly saved query**");
    browsePage.getManageQueriesModalOpened();
    queryComponent.getManageQueryModal().should("be.visible");
    queryComponent.getQueryByName("personQuery").first().click();
    queryComponent.getManageQueryModal().should("not.exist");

    cy.log("**verify the applied query details on Browse page**");
    cy.waitForAsyncRequest();
    browsePage.waitForSpinnerToDisappear();
    browsePage.getTotalDocuments().should("not.be.equal", 0);
    entitiesSidebar.openBaseEntityFacets("Person");
    browsePage.getFacetItemCheckbox("fname", "Alice").should("be.checked");
    browsePage.getAppliedFacets("Alice").should("exist");
    entitiesSidebar.backToMainSidebar();
    browsePage.getSelectedQuery().should("contain", "personQuery");
  });

  it("Verify editing previously saved query, updates the currently applied query name in browse page", () => {
    explorePage.navigate();
    browsePage.switchToTableView();
    browsePage.waitForSpinnerToDisappear();
    browsePage.waitForHCTableToLoad();
    browsePage.getSaveQueriesDropdown().should("be.visible");
    browsePage.selectQuery("personQuery");

    cy.log("**verify the applied query details on Browse page**");
    cy.waitForAsyncRequest();
    browsePage.waitForSpinnerToDisappear();
    browsePage.getSelectedQuery().should("contain", "personQuery");

    cy.log("**verify the manage queries modal button is visible**");
    explorePage.clickExploreSettingsMenuIcon();
    browsePage.getManageQueriesButton().should("be.visible");

    cy.log("**open manage queries modal dialog and apply previosly saved query**");
    browsePage.getManageQueriesModalOpened();
    queryComponent.getManageQueryModal().should("be.visible");

    queryComponent.getEditQuery().click();
    queryComponent.getEditQueryName().clear();
    queryComponent.getEditQueryName().type("edited-personQuery");
    queryComponent.getSubmitButton().click();
    cy.waitForAsyncRequest();
    browsePage.getManageQueryCloseIcon().should("be.visible").click();
    queryComponent.getManageQueryModal().should("not.exist");

    cy.log("**Check if the current query name is updated in browse page or not**");
    browsePage.getSelectedQuery().should("contain", "edited-personQuery");
  });
});
