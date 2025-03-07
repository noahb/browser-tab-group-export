document.addEventListener('DOMContentLoaded', function() {
  const exportGroupList = document.getElementById('export-group-list');
  const importGroupList = document.getElementById('import-group-list');
  const exportSelectedBtn = document.getElementById('exportSelectedGroups');
  const selectImportFileBtn = document.getElementById('selectImportFile');
  const importSelectedBtn = document.getElementById('importSelectedGroups');
  const fileInput = document.getElementById('fileInput');
  const importOptions = document.getElementById('import-options');
  const statusDiv = document.getElementById('status');
  const errorDiv = document.getElementById('error');
  const collapseGroupsCheckbox = document.getElementById('collapseGroups');
  const selectAllExportBtn = document.getElementById('selectAllExport');
  const deselectAllExportBtn = document.getElementById('deselectAllExport');
  const selectAllImportBtn = document.getElementById('selectAllImport');
  const deselectAllImportBtn = document.getElementById('deselectAllImport');
  
  let availableGroups = [];
  let importableGroups = [];
  
  // Color mapping
  const colorMap = {
    grey: '#7d7d7d',
    blue: '#4285f4',
    red: '#ea4335',
    yellow: '#fbbc04',
    green: '#34a853',
    pink: '#ff50d8',
    purple: '#a142f4',
    cyan: '#24c1e0',
    orange: '#fa903e'
  };
  
  // Load available tab groups when popup opens
  function loadTabGroups() {
    chrome.runtime.sendMessage({ action: 'getTabGroups' }, function(response) {
      if (response.success) {
        availableGroups = response.groups;
        renderExportGroups();
        updateExportButton();
      } else {
        errorDiv.textContent = 'Error: ' + response.error;
      }
    });
  }
  
  // Render the list of available tab groups for export
  function renderExportGroups() {
    if (availableGroups.length === 0) {
      exportGroupList.innerHTML = 'No tab groups found.';
      return;
    }
    
    exportGroupList.innerHTML = '';
    availableGroups.forEach(group => {
      const item = document.createElement('div');
      item.className = 'group-item';
      
      const colorDiv = document.createElement('div');
      colorDiv.className = 'group-color';
      colorDiv.style.backgroundColor = colorMap[group.color] || '#7d7d7d';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.groupId = group.id;
      checkbox.className = 'export-group-checkbox';
      checkbox.addEventListener('change', updateExportButton);
      
      const checkboxContainer = document.createElement('div');
      checkboxContainer.className = 'checkbox-container';
      checkboxContainer.appendChild(checkbox);
      
      const title = document.createElement('span');
      title.textContent = group.title || 'Unnamed Group';
      
      const tabCount = document.createElement('span');
      tabCount.className = 'tab-count';
      tabCount.textContent = `${group.tabCount} tab${group.tabCount === 1 ? '' : 's'}`;
      
      item.appendChild(checkboxContainer);
      item.appendChild(colorDiv);
      item.appendChild(title);
      item.appendChild(tabCount);
      exportGroupList.appendChild(item);
    });
  }
  
  // Render the list of importable tab groups
  function renderImportGroups() {
    if (importableGroups.length === 0) {
      importGroupList.innerHTML = 'No tab groups found in file.';
      return;
    }
    
    importGroupList.innerHTML = '';
    importableGroups.forEach((group, index) => {
      const item = document.createElement('div');
      item.className = 'group-item';
      
      const colorDiv = document.createElement('div');
      colorDiv.className = 'group-color';
      colorDiv.style.backgroundColor = colorMap[group.color] || '#7d7d7d';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.groupIndex = index;
      checkbox.className = 'import-group-checkbox';
      checkbox.checked = true;
      
      const checkboxContainer = document.createElement('div');
      checkboxContainer.className = 'checkbox-container';
      checkboxContainer.appendChild(checkbox);
      
      const title = document.createElement('span');
      title.textContent = group.title || 'Unnamed Group';
      
      const tabCount = document.createElement('span');
      tabCount.className = 'tab-count';
      tabCount.textContent = `${group.tabs.length} tab${group.tabs.length === 1 ? '' : 's'}`;
      
      item.appendChild(checkboxContainer);
      item.appendChild(colorDiv);
      item.appendChild(title);
      item.appendChild(tabCount);
      importGroupList.appendChild(item);
    });
  }
  
  // Update export button state based on selections
  function updateExportButton() {
    const checkboxes = document.querySelectorAll('.export-group-checkbox:checked');
    exportSelectedBtn.disabled = checkboxes.length === 0;
  }
  
  // Select all export groups
  selectAllExportBtn.addEventListener('click', function() {
    document.querySelectorAll('.export-group-checkbox').forEach(checkbox => {
      checkbox.checked = true;
    });
    updateExportButton();
  });
  
  // Deselect all export groups
  deselectAllExportBtn.addEventListener('click', function() {
    document.querySelectorAll('.export-group-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
    updateExportButton();
  });
  
  // Select all import groups
  selectAllImportBtn.addEventListener('click', function() {
    document.querySelectorAll('.import-group-checkbox').forEach(checkbox => {
      checkbox.checked = true;
    });
  });
  
  // Deselect all import groups
  deselectAllImportBtn.addEventListener('click', function() {
    document.querySelectorAll('.import-group-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
  });
  
  // Export selected tab groups
  exportSelectedBtn.addEventListener('click', function() {
    const selectedGroupIds = Array.from(document.querySelectorAll('.export-group-checkbox:checked'))
      .map(checkbox => parseInt(checkbox.dataset.groupId));
    
    chrome.runtime.sendMessage({ 
      action: 'exportTabGroups',
      groupIds: selectedGroupIds
    }, function(response) {
      if (response.success) {
        statusDiv.textContent = 'Tab groups exported successfully!';
        errorDiv.textContent = '';
      } else {
        errorDiv.textContent = 'Error: ' + response.error;
        statusDiv.textContent = '';
      }
    });
  });
  
  // Select file for import
  selectImportFileBtn.addEventListener('click', function() {
    fileInput.click();
  });
  
  // Process selected import file
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        importableGroups = JSON.parse(event.target.result);
        importOptions.style.display = 'block';
        renderImportGroups();
      } catch (error) {
        errorDiv.textContent = 'Error parsing file: ' + error.message;
        statusDiv.textContent = '';
      }
    };
    reader.readAsText(file);
  });
  
  // Import selected tab groups
  importSelectedBtn.addEventListener('click', function() {
    const selectedGroups = Array.from(document.querySelectorAll('.import-group-checkbox:checked'))
      .map(checkbox => importableGroups[parseInt(checkbox.dataset.groupIndex)]);
    
    chrome.runtime.sendMessage({ 
      action: 'importTabGroups',
      tabGroups: selectedGroups,
      collapsed: collapseGroupsCheckbox.checked
    }, function(response) {
      if (response.success) {
        statusDiv.textContent = 'Tab groups imported successfully!';
        errorDiv.textContent = '';
      } else {
        errorDiv.textContent = 'Error: ' + response.error;
        statusDiv.textContent = '';
      }
    });
  });
  
  // Initial load
  loadTabGroups();
});