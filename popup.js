document.addEventListener('DOMContentLoaded', function() {
  const exportButton = document.getElementById('exportGroups');
  const importButton = document.getElementById('importGroups');
  const fileInput = document.getElementById('fileInput');
  const statusDiv = document.getElementById('status');
  const errorDiv = document.getElementById('error');
  
  exportButton.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'exportTabGroups' }, function(response) {
      if (response.success) {
        statusDiv.textContent = 'Tab groups exported successfully!';
        errorDiv.textContent = '';
      } else {
        errorDiv.textContent = 'Error: ' + response.error;
        statusDiv.textContent = '';
      }
    });
  });
  
  importButton.addEventListener('click', function() {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const tabGroups = JSON.parse(event.target.result);
        chrome.runtime.sendMessage({ action: 'importTabGroups', tabGroups }, function(response) {
          if (response.success) {
            statusDiv.textContent = 'Tab groups imported successfully!';
            errorDiv.textContent = '';
          } else {
            errorDiv.textContent = 'Error: ' + response.error;
            statusDiv.textContent = '';
          }
        });
      } catch (error) {
        errorDiv.textContent = 'Error parsing file: ' + error.message;
        statusDiv.textContent = '';
      }
    };
    reader.readAsText(file);
  });
});