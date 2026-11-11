import { useState } from 'react';
import { useSellerChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Package, 
  Clock,
  User,
  ArrowLeft,
  Trash2,
  MoreVertical,
  Globe
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export const Chat: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const {
    conversations,
    selectedConversation,
    messages,
    loading,
    sending,
    deleting,
    sendMessage,
    selectConversation,
    deleteConversation,
  } = useSellerChat();

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;
    const success = await sendMessage(inputValue);
    if (success) {
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBack = () => {
    selectConversation(null);
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;
    
    const success = await deleteConversation(conversationToDelete);
    if (success) {
      toast.success('Conversa apagada com sucesso');
    } else {
      toast.error('Erro ao apagar conversa');
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const openDeleteDialog = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
          <MessageCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Chat
          </h1>
          <p className="text-muted-foreground text-sm">Gerencie conversas com clientes</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xl">
        <div className="flex h-[650px]">
          {/* Conversations List */}
          <div
            className={cn(
              'w-full md:w-96 border-r border-border flex flex-col bg-gradient-to-b from-muted/30 to-background',
              selectedConversation && 'hidden md:flex'
            )}
          >
            <div className="p-4 border-b border-border bg-background/80 backdrop-blur-sm">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-violet-500" />
                Conversas
              </h2>
            </div>
            <ScrollArea className="flex-1">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <MessageCircle className="h-8 w-8 text-violet-500 opacity-60" />
                  </div>
                  <p className="font-medium">Nenhuma conversa ainda</p>
                  <p className="text-sm mt-1 opacity-70">
                    As mensagens dos clientes aparecerão aqui
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        'group relative rounded-xl transition-all duration-200 cursor-pointer',
                        selectedConversation?.id === conv.id 
                          ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20' 
                          : 'hover:bg-muted/60'
                      )}
                    >
                      <button
                        onClick={() => selectConversation(conv)}
                        className="w-full p-3 text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                            selectedConversation?.id === conv.id
                              ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg"
                              : "bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600"
                          )}>
                            <User className={cn(
                              "h-5 w-5",
                              selectedConversation?.id === conv.id ? "text-white" : "text-slate-600 dark:text-slate-300"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium text-sm truncate">
                                {conv.customer_ip}
                              </span>
                            </div>
                            {conv.product_name && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Badge variant="outline" className="text-xs px-2 py-0 h-5 bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800">
                                  <Package className="h-2.5 w-2.5 mr-1" />
                                  {conv.product_name}
                                </Badge>
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1.5">
                              <Clock className="h-3 w-3" />
                              <span>
                                {formatDistanceToNow(new Date(conv.last_message_at), {
                                  locale: ptBR,
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                      
                      {/* Delete button */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => openDeleteDialog(conv.id, e as any)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Apagar conversa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div
            className={cn(
              'flex-1 flex flex-col bg-gradient-to-b from-background to-muted/20',
              !selectedConversation && 'hidden md:flex'
            )}
          >
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-background/80 backdrop-blur-sm flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="h-11 w-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="font-semibold">{selectedConversation.customer_ip}</p>
                    </div>
                    {selectedConversation.product_name && (
                      <Badge variant="outline" className="mt-1 text-xs bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800">
                        <Package className="h-3 w-3 mr-1" />
                        {selectedConversation.product_name}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => openDeleteDialog(selectedConversation.id, e)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 opacity-50" />
                      </div>
                      <p>Nenhuma mensagem ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-w-2xl mx-auto">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm',
                            msg.sender_type === 'seller'
                              ? 'ml-auto bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-br-md'
                              : 'mr-auto bg-white dark:bg-slate-800 border border-border rounded-bl-md'
                          )}
                        >
                          <p className="leading-relaxed">{msg.message}</p>
                          <div
                            className={cn(
                              'text-[10px] mt-1.5 opacity-70',
                              msg.sender_type === 'seller' ? 'text-right' : 'text-left'
                            )}
                          >
                            {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm">
                  <div className="flex gap-2 max-w-2xl mx-auto">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua resposta..."
                      className="flex-1 rounded-xl border-2 focus-visible:ring-violet-500"
                      disabled={sending}
                    />
                    <Button 
                      onClick={handleSend} 
                      disabled={!inputValue.trim() || sending}
                      className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center">
                    <MessageCircle className="h-10 w-10 text-violet-500 opacity-60" />
                  </div>
                  <p className="text-lg font-semibold">Selecione uma conversa</p>
                  <p className="text-sm opacity-70 mt-1">
                    Escolha uma conversa na lista para ver as mensagens
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todas as mensagens desta conversa serão permanentemente apagadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
