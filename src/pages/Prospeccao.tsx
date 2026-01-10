import { useProspeccaoState } from "@/hooks/useProspeccaoState";
import { ProspeccaoHeader } from "@/components/prospeccao/ProspeccaoHeader";
import { InternetSearchMode } from "@/components/prospeccao/InternetSearchMode";
import { CNPJSearchMode } from "@/components/prospeccao/CNPJSearchMode";
import { DatabaseSearchMode } from "@/components/prospeccao/DatabaseSearchMode";
import { InternetResultsView } from "@/components/prospeccao/InternetResultsView";
import { DatabaseResultsHeader } from "@/components/prospeccao/DatabaseResultsHeader";
import { ProspeccaoContent } from "@/components/prospeccao/ProspeccaoContent";
import { CNPJPullTab } from "@/components/prospeccao/CNPJPullTab";
import { StreamingSearchOverlay } from "@/components/prospeccao/StreamingSearchOverlay";
import { BackgroundSearchBanner } from "@/components/prospeccao/BackgroundSearchBanner";
import { SaveSearchDialog } from "@/components/prospeccao/SaveSearchDialog";
import { SendToFunnelDialog } from "@/components/prospeccao/SendToFunnelDialog";
import { CNPJBatchDialog } from "@/components/prospeccao/CNPJBatchDialog";
import { toast } from "@/hooks/use-toast";

export default function Prospeccao() {
  const state = useProspeccaoState();

  // If showing results panel (internet search), render results view
  if (state.showResultsPanel && state.searchMode === "internet") {
    return (
      <InternetResultsView
        apiResults={state.apiResults}
        apiTotal={state.apiTotal}
        searchStats={state.searchStats}
        selectedIds={state.selectedIds}
        onSelectChange={state.setSelectedIds}
        pageSize={state.pageSize}
        onPageSizeChange={state.setPageSize}
        filters={state.filters}
        isLoading={state.companySearch.isPending}
        isSearchMinimized={state.isSearchMinimized}
        onRestoreSearch={() => state.setIsSearchMinimized(false)}
        onCancelSearch={state.handleCancelSearch}
        onMinimizeSearch={state.handleMinimizeToBackground}
        onBack={state.handleBackFromResults}
        onAddToMyBase={state.handleAddToMyBase}
        onSendToLeadsBase={state.handleSendToLeadsBase}
        onExport={state.handleExport}
        sendToFunnelOpen={state.sendToFunnelOpen}
        onSendToFunnelOpenChange={state.setSendToFunnelOpen}
        isAddingToBase={state.addProspectFromCNPJ.isPending}
        isSendingToBase={state.sendToLeadsBase.isPending}
        displayData={state.displayData}
      />
    );
  }

  // Default view with filters
  return (
    <>
      <StreamingSearchOverlay 
        isVisible={state.streamingSearch.isSearching && !state.isSearchMinimized} 
        filters={state.filters}
        companies={state.streamingSearch.companies}
        progress={state.streamingSearch.progress}
        onCancel={state.handleCancelSearch}
        onMinimize={state.handleMinimizeToBackground}
        onViewResults={state.handleViewStreamingResults}
      />
      
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Background Search Banner */}
        <BackgroundSearchBanner
          isVisible={state.streamingSearch.isSearching && state.isSearchMinimized}
          filters={state.filters}
          onRestore={() => state.setIsSearchMinimized(false)}
          onCancel={state.handleCancelSearch}
        />
        
        {/* Header with tabs and actions */}
        <ProspeccaoHeader
          searchMode={state.searchMode}
          onSearchModeChange={state.setSearchMode}
          pageSize={state.pageSize}
          onPageSizeChange={state.setPageSize}
          savedSearches={state.savedSearches}
          onLoadSavedSearch={state.handleLoadSavedSearch}
          onDeleteSavedSearch={state.handleDeleteSavedSearch}
          onApplyTemplate={state.handleApplyTemplate}
          onApplyCachedSearch={state.handleApplyCachedSearch}
          onApplyRecentFilters={state.setFilters}
          getRecentSearches={state.getRecentSearches}
          clearCache={state.clearCache}
        />

        {/* Search mode specific content in header area */}
        <div className="px-6 pb-4 border-b">
          {state.searchMode === "internet" && (
            <InternetSearchMode
              filters={state.filters}
              onFiltersChange={state.setFilters}
              onSearch={state.handleSearch}
              onClear={state.handleClearFilters}
              onSaveSearch={() => state.setSaveSearchOpen(true)}
              isLoading={state.isLoading}
            />
          )}

          {state.searchMode === "cnpj" && (
            <CNPJSearchMode
              cnpjResult={state.cnpjResult}
              cnpjLoading={state.cnpjLoading}
              cnpjError={state.cnpjError}
              onSearch={state.handleCNPJSearch}
              onClear={state.handleCNPJClear}
              onAddToProspects={state.handleAddCNPJToProspects}
              onSendToLeads={state.handleSendCNPJToLeads}
              onSendToFunnel={() => state.setSendCNPJToFunnelOpen(true)}
              onOpenBatchDialog={() => state.setBatchDialogOpen(true)}
              isAdding={state.addProspectFromCNPJ.isPending || state.sendToLeadsBase.isPending}
            />
          )}

          {state.searchMode === "pull-cnpjs" && (
            <CNPJPullTab />
          )}

          {state.searchMode === "database" && (
            <DatabaseSearchMode
              filters={state.filters}
              onFiltersChange={state.setFilters}
              onClear={state.handleClearFilters}
              onSaveSearch={() => state.setSaveSearchOpen(true)}
            />
          )}
        </div>

        {/* Results Header - Only for database mode when there is data */}
        {state.searchMode === "database" && state.displayData.length > 0 && (
          <DatabaseResultsHeader
            selectedCount={state.selectedIds.length}
            totalCount={state.displayData.length}
            pageSize={state.pageSize}
            onPageSizeChange={state.setPageSize}
            onSendToFunnel={() => state.setSendToFunnelOpen(true)}
            onSendToLeadsBase={state.handleSendToLeadsBase}
            onExport={state.handleExport}
            isSendingToBase={state.sendToLeadsBase.isPending}
          />
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <ProspeccaoContent
            searchMode={state.searchMode}
            hasSearched={state.hasSearched}
            isLoading={state.isLoading}
            isError={state.isError}
            cnpjResult={state.cnpjResult}
            cnpjError={state.cnpjError}
            displayData={state.displayData}
            selectedIds={state.selectedIds}
            onSelectChange={state.setSelectedIds}
            page={state.page}
            onPageChange={state.setPage}
            pageSize={state.pageSize}
            refetch={state.refetch}
          />
        </div>

        {/* Dialogs */}
        <SaveSearchDialog
          open={state.saveSearchOpen}
          onOpenChange={state.setSaveSearchOpen}
          filters={state.filters}
          resultsCount={state.displayData.length}
        />

        <SendToFunnelDialog
          open={state.sendToFunnelOpen}
          onOpenChange={state.setSendToFunnelOpen}
          selectedProspects={state.selectedIds}
          prospects={state.displayData}
          onSuccess={() => state.setSelectedIds([])}
        />
        
        {/* Dialog for sending CNPJ result to funnel */}
        {state.cnpjResult && (
          <SendToFunnelDialog
            open={state.sendCNPJToFunnelOpen}
            onOpenChange={state.setSendCNPJToFunnelOpen}
            selectedProspects={[state.cnpjResult.cnpj]}
            cnpjData={state.cnpjResult}
            onSuccess={() => {
              toast({
                title: "Enviado para funil",
                description: `${state.cnpjResult!.nomeFantasia || state.cnpjResult!.razaoSocial} foi enviado para o funil.`
              });
            }}
          />
        )}

        {/* Batch CNPJ Dialog */}
        <CNPJBatchDialog
          open={state.batchDialogOpen}
          onOpenChange={state.setBatchDialogOpen}
          onAddToProspects={state.handleBatchAddToProspects}
          onSendToLeads={state.handleBatchSendToLeads}
          isAdding={state.batchAdding}
        />
      </div>
    </>
  );
}
