/* LO$TKART — Toast Notifications
   Usage:
   showToast('Saved!', 'success');
   showToast('Failed to submit', 'error');
   showToast('Please log in first', 'info');
*/

(function () {
    let host = document.querySelector('.toast-host');
    if (!host) {
        host = document.createElement('div');
        host.className = 'toast-host';
        document.body.appendChild(host);
    }

    const ICONS = {
        success: 'fa-circle-check',
        error:   'fa-circle-exclamation',
        info:    'fa-circle-info'
    };

    window.showToast = function (message, type = 'info', duration = 3500) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fa-solid ${ICONS[type] || ICONS.info}"></i>
            <div class="toast-body">${message}</div>
        `;
        host.appendChild(toast);

        setTimeout(function () {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };
})();