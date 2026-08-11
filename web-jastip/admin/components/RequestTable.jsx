import { createSignal } from "solid-js";
import { showNotification } from "../../src/store/WebStore";

export const RequestTable = (props) => {
    const [approvalStatus, setApprovalStatus] = createSignal(props.approval_status || 'pending');
    const [isProcessing, setIsProcessing] = createSignal(false);
    async function handleApproval(statusValue) {
        if(isProcessing()) return;
        setIsProcessing(true);
        try {
            const response = await fetch('http://localhost:5000/api/approval', {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    value: statusValue,
                    reqId: props.id
                })
            });

            const data = await response.json();

            if (response.ok) {
                setApprovalStatus(statusValue);
                showNotification(data.message || 'Status berhasil diperbarui', 'success');
                if (props.onStatusChange) {
                    props.onStatusChange(props.id, statusValue);
                }
            } else {
                showNotification(data.message || 'Gagal memperbarui status', 'error');
            }
        } catch (error) {
            console.error('Error updating approval:', error);
            showNotification('Terjadi kesalahan pada server', 'error');
        }finally{
            setIsProcessing(false);
        }
    }

    return (
        <tr>
            <td>
                <div class="user-info">
                    <strong>{props.user_name || props.email || 'Anonim'}</strong>
                    <span class="desc">WA: {props.phone_number || '-'}</span>
                </div>
            </td>
            <td>
                <div class="request-img-thumb">
                    {props.product_image_url ? (
                        <img src={props.product_image_url} alt={props.name} style="width: 100%; height: 100%; object-fit: cover;" />
                    ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color: #94A3B8;">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                    )}
                </div>
            </td>
            <td>
                <div class="item-info">
                    <a href={props.item_link || '#'} target="_blank" rel="noopener noreferrer" class="item-link">{props.name}</a>
                    <span class="desc">Kategori: {props.category || '-'}. {props.details}</span>
                </div>
            </td>
            <td>
                <div class="approval-actions">
                    <button 
                        class={`btn btn-approve ${approvalStatus() === 'approved' ? 'active' : ''}`}
                        onClick={() => handleApproval('approved')}
                        disabled={isProcessing()}
                    >
                        {approvalStatus() === 'approved' ? 'Approved' : 'Approve'}
                    </button>
                    <button 
                        class={`btn btn-deny ${approvalStatus() === 'denied' ? 'active' : ''}`}
                        onClick={() => handleApproval('denied')}
                    >
                        {approvalStatus() === 'denied' ? 'Denied' : 'Deny'}
                    </button>
                </div>
            </td>
            <td>
                <select class="select-status status-incomplete">
                    <option value="complete" selected={props.status === 'complete'}>Complete (Berhasil Didapat)</option>
                    <option value="incomplete" selected={props.status !== 'complete'}>Incomplete (Masa Pencarian)</option>
                </select>
            </td>
        </tr>
    );
};