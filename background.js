chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'exportTabGroups') {
    exportTabGroups()
      .then(data => {
        sendResponse({ success: true });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates async response
  } else if (request.action === 'importTabGroups') {
    importTabGroups(request.tabGroups)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Indicates async response
  }
});

async function exportTabGroups() {
  try {
    // Get all windows
    const windows = await chrome.windows.getAll({ populate: true });
    const tabGroupsData = [];
    
    for (const window of windows) {
      // Get all tabs in the window
      const tabs = await chrome.tabs.query({ windowId: window.id });
      
      // Get all tab groups in the window
      const groups = await chrome.tabGroups.query({ windowId: window.id });
      
      // Map tabs to their groups
      for (const group of groups) {
        const groupTabs = tabs.filter(tab => tab.groupId === group.id);
        
        if (groupTabs.length > 0) {
          tabGroupsData.push({
            title: group.title || '',
            color: group.color || 'grey',
            tabs: groupTabs.map(tab => ({
              url: tab.url,
              title: tab.title,
              pinned: tab.pinned,
              active: tab.active
            }))
          });
        }
      }
    }
    
    // Convert data to JSON string
    const jsonString = JSON.stringify(tabGroupsData, null, 2);
    
    // Generate a filename with the current date
    const date = new Date();
    const fileName = `tab-groups-${date.toISOString().split('T')[0]}.json`;
    
    // Create a data URL instead of using URL.createObjectURL
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString);
    
    // Download the file
    await chrome.downloads.download({
      url: dataUrl,
      filename: fileName,
      saveAs: true
    });
    
    return tabGroupsData;
  } catch (error) {
    console.error('Error exporting tab groups:', error);
    throw error;
  }
}

async function importTabGroups(tabGroupsData) {
  if (!Array.isArray(tabGroupsData) || tabGroupsData.length === 0) {
    throw new Error('Invalid tab groups data');
  }
  
  try {
    // Get the current window
    const currentWindow = await chrome.windows.getCurrent();
    
    for (const groupData of tabGroupsData) {
      // Create tabs for this group
      const tabIds = [];
      
      for (const tabData of groupData.tabs) {
        const tab = await chrome.tabs.create({
          url: tabData.url,
          pinned: tabData.pinned,
          active: false,
          windowId: currentWindow.id
        });
        
        tabIds.push(tab.id);
      }
      
      // Create a new group with these tabs
      if (tabIds.length > 0) {
        const groupId = await chrome.tabs.group({ tabIds });
        
        // Update the group properties
        await chrome.tabGroups.update(groupId, {
          title: groupData.title,
          color: groupData.color
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error importing tab groups:', error);
    throw error;
  }
}